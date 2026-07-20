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
      tenantId: z.string(),
      plan: z.enum(['starter', 'pro']),
      status: z.enum(['trial', 'active', 'past_due', 'cancelled']),
      daysToGrant: z.number().optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient()

      // Calculate period end date
      const periodEnd = input.daysToGrant
        ? new Date(
            Date.now() +
            input.daysToGrant * 24 * 60 * 60 * 1000
          ).toISOString()
        : input.expiresAt || null

      // Check if subscription exists for this tenant
      const { data: existing } = await adminClient
        .from('subscriptions')
        .select('id')
        .eq('tenant_id', input.tenantId)
        .single()

      if (existing) {
        // UPDATE existing subscription
        const { error } = await adminClient
          .from('subscriptions')
          .update({
            plan_name: input.plan,
            status: input.status,
            amount_kobo: input.plan === 'pro'
              ? 4500000
              : 1500000,
            current_period_end: periodEnd,
            trial_ends_at: input.status === 'trial'
              ? periodEnd
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('tenant_id', input.tenantId)

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message
          })
        }
      } else {
        // INSERT new subscription
        const { error } = await adminClient
          .from('subscriptions')
          .insert({
            tenant_id: input.tenantId,
            plan_name: input.plan,
            status: input.status,
            amount_kobo: input.plan === 'pro'
              ? 4500000
              : 1500000,
            current_period_end: periodEnd,
            trial_ends_at: input.status === 'trial'
              ? periodEnd
              : null,
          })

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message
          })
        }
      }

      // Log to admin audit log
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
            periodEnd,
            grantedAt: new Date().toISOString(),
          }
        })

      return { success: true }
    }),

  // Extend trial by N days
  extendTrial: adminProcedure
    .input(z.object({
      tenantId: z.string(),
      days: z.number().default(14),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient()

      // Get current trial end
      const { data } = await adminClient
        .from('subscriptions')
        .select('trial_ends_at')
        .eq('tenant_id', input.tenantId)
        .single()

      // Extend from current end OR from now
      const currentEnd = data?.trial_ends_at
        ? new Date(data.trial_ends_at)
        : new Date()

      // If trial already expired extend from now
      const baseDate = currentEnd < new Date()
        ? new Date()
        : currentEnd

      const newEnd = new Date(
        baseDate.getTime() +
        input.days * 24 * 60 * 60 * 1000
      ).toISOString()

      const { error } = await adminClient
        .from('subscriptions')
        .update({
          trial_ends_at: newEnd,
          status: 'trial',
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', input.tenantId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        })
      }

      // Log action
      await adminClient
        .from('admin_audit_log')
        .insert({
          admin_id: ctx.userId,
          action: 'extend_trial',
          target_tenant_id: input.tenantId,
          details: {
            daysAdded: input.days,
            newTrialEnd: newEnd,
          }
        })

      return { success: true, newTrialEnd: newEnd }
    }),

  // Suspend lab access
  suspendTenant: adminProcedure
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient()

      const { error } = await adminClient
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', input.tenantId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        })
      }

      await adminClient
        .from('admin_audit_log')
        .insert({
          admin_id: ctx.userId,
          action: 'suspend_tenant',
          target_tenant_id: input.tenantId,
          details: { suspendedAt: new Date().toISOString() }
        })

      return { success: true }
    }),

  // Restore lab access
  restoreTenant: adminProcedure
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient()

      const { error } = await adminClient
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', input.tenantId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        })
      }

      await adminClient
        .from('admin_audit_log')
        .insert({
          admin_id: ctx.userId,
          action: 'restore_tenant',
          target_tenant_id: input.tenantId,
          details: { restoredAt: new Date().toISOString() }
        })

      return { success: true }
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
