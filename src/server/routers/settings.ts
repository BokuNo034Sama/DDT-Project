import { z } from "zod";
import { router, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const settingsRouter = router({
  // Get current tenant details
  getTenant: managerProcedure.query(async ({ ctx }) => {
    const { supabase, tenantId } = ctx;

    const { data, error } = await supabase
      .from("tenants")
      .select("id, name, slug, code_prefix, is_active, created_at")
      .eq("id", tenantId)
      .single();

    if (error || !data) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });
    }

    return data;
  }),

  // Update lab name and code prefix
  updateTenant: managerProcedure
    .input(
      z.object({
        name: z.string().min(2, "Lab name must be at least 2 characters"),
        code_prefix: z
          .string()
          .min(1)
          .max(4)
          .regex(/^[A-Z]+$/, "Prefix must be uppercase letters only"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;

      const { data, error } = await supabase
        .from("tenants")
        .update({
          name: input.name,
          code_prefix: input.code_prefix,
        })
        .eq("id", tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  // Deactivate lab (lab_owner / super_admin only)
  deactivateTenant: managerProcedure
    .input(
      z.object({
        confirmSlug: z.string().min(1, "Please type the lab slug to confirm"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;

      // Fetch the tenant slug to validate
      const { data: tenant, error: fetchError } = await supabase
        .from("tenants")
        .select("slug")
        .eq("id", tenantId)
        .single();

      if (fetchError || !tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });
      }

      if (tenant.slug !== input.confirmSlug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Slug does not match. Deactivation cancelled.",
        });
      }

      const { error } = await supabase
        .from("tenants")
        .update({ is_active: false })
        .eq("id", tenantId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),

  initializeBillingSession: managerProcedure
    .input(
      z.object({
        planName: z.string(),
        price: z.number(),
        origin: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, userEmail } = ctx;
      if (!tenantId || !userId || !userEmail) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized context" });
      }

      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      const isSimulation = !secretKey || secretKey === "" || secretKey.startsWith("sk_test_placeholder");

      if (isSimulation) {
        const queryParams = new URLSearchParams({
          billing_simulate: "true",
          tenantId: tenantId,
          planName: input.planName,
          price: String(input.price),
        });
        const simulationUrl = `${input.origin}/settings?${queryParams.toString()}`;
        return { authorization_url: simulationUrl };
      }

      try {
        const response = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            amount: input.price * 100, // in Kobo
            callback_url: `${input.origin}/api/billing/callback`,
            metadata: {
              tenantId,
              userId,
              planName: input.planName,
              price: input.price,
            },
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.status) {
          throw new Error(data.message || "Failed to initialize Paystack session");
        }

        return { authorization_url: data.data.authorization_url };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Paystack integration error",
        });
      }
    }),

  simulatePayment: managerProcedure
    .input(
      z.object({
        tenantId: z.string().uuid(),
        planName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;
      if (!tenantId || tenantId !== input.tenantId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Tenant mismatch" });
      }

      // Guard: Only allow simulation in development or when secret key is unset.
      const isDev = process.env.NODE_ENV === "development";
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      const hasSecret = !!secretKey && secretKey !== "" && !secretKey.startsWith("sk_test_placeholder");
      
      if (!isDev && hasSecret) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Payment simulation is disabled in production environments when live keys are configured.",
        });
      }

      const { data, error } = await supabase
        .from("tenants")
        .update({
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true, tenant: data };
    }),

  cancelSubscription: managerProcedure.mutation(async ({ ctx }) => {
    const { supabase, tenantId } = ctx;
    if (!tenantId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized context" });
    }

    const { data, error } = await supabase
      .from("tenants")
      .update({
        subscription_status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId)
      .select()
      .single();

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }

    return { success: true, tenant: data };
  }),
});
