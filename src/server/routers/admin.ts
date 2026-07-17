import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const adminRouter = router({
  // Get all tenants (joined with their subscription details)
  listTenants: adminProcedure.query(async () => {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("tenants")
      .select(`
        *,
        subscriptions (
          plan_name,
          status,
          current_period_end,
          trial_ends_at
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }

    return (data || []).map((tenant: any) => {
      const sub = tenant.subscriptions?.[0] || null;
      return {
        ...tenant,
        plan_name: sub?.plan_name || "starter",
        subscription_status: sub?.status || tenant.subscription_status || "trial",
        expires_at: sub?.current_period_end || sub?.trial_ends_at || null,
      };
    });
  }),

  // Update tenant status
  updateTenantStatus: adminProcedure
    .input(
      z.object({
        tenantId: z.string().uuid(),
        status: z.enum(["trial", "active", "inactive"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      const { data, error } = await adminClient
        .from("tenants")
        .update({ subscription_status: input.status, updated_at: new Date().toISOString() })
        .eq("id", input.tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  // Set tenant subscription and log audit log
  setTenantSubscription: adminProcedure
    .input(z.object({
      tenantId: z.string().uuid(),
      plan: z.enum(['starter', 'pro']),
      status: z.enum(['trial', 'active', 'past_due', 'cancelled']),
      expiresAt: z.string().optional(),
      daysToGrant: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      // Calculate period end
      const periodEnd = input.daysToGrant
        ? new Date(Date.now() + input.daysToGrant * 24 * 60 * 60 * 1000).toISOString()
        : input.expiresAt || null;

      // Update tenant status field in tenants table
      const statusMap: Record<string, "trial" | "active" | "inactive"> = {
        trial: "trial",
        active: "active",
        past_due: "trial",
        cancelled: "inactive",
      };
      
      const mappedTenantStatus = statusMap[input.status] || "inactive";

      const { error: tenantUpdateError } = await adminClient
        .from("tenants")
        .update({
          subscription_status: mappedTenantStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.tenantId);

      if (tenantUpdateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update tenant status: " + tenantUpdateError.message,
        });
      }

      // Upsert subscription record
      const { error } = await adminClient
        .from('subscriptions')
        .upsert({
          tenant_id: input.tenantId,
          plan_name: input.plan,
          status: input.status,
          amount_kobo: input.plan === 'pro' ? 4500000 : 1500000,
          current_period_end: periodEnd,
          trial_ends_at: input.status === 'trial' ? periodEnd : null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id'
        });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        });
      }

      // Insert audit log
      await adminClient
        .from('admin_audit_log')
        .insert({
          admin_id: ctx.userId,
          action: 'set_subscription',
          target_tenant_id: input.tenantId,
          details: {
            plan: input.plan,
            status: input.status,
            daysGranted: input.daysToGrant,
            expiresAt: periodEnd,
            grantedAt: new Date().toISOString(),
          }
        });

      return { success: true };
    }),

  // List audit logs
  listAuditLogs: adminProcedure.query(async () => {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("admin_audit_log")
      .select(`
        *,
        admin:users!admin_id (
          full_name
        ),
        tenant:tenants!target_tenant_id (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }

    return data || [];
  }),
});
