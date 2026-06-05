import { z } from "zod";
import { router, managerProcedure, protectedProcedure } from "../trpc";
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

      // Try updating subscriptions table if it exists
      try {
        const planKey = input.planName.toLowerCase().includes("pro") ? "pro" : "starter";
        await (supabase as any)
          .from("subscriptions")
          .upsert({
            tenant_id: tenantId,
            status: "active",
            plan_name: planKey,
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "tenant_id" });
      } catch (e) {
        // Ignore or fallback
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

    // Try updating subscriptions table if it exists
    try {
      await (supabase as any)
        .from("subscriptions")
        .update({
          status: "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId);
    } catch (e) {
      // Ignore or fallback
    }

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }

    return { success: true, tenant: data };
  }),

  // Get subscription status
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    // Force Next.js to not cache this query
    try {
      const { unstable_noStore } = await import("next/cache");
      unstable_noStore();
    } catch (e) {
      // Ignore if outside Next context
    }

    const { supabase, tenantId } = ctx;

    // 1. Fetch the tenant created_at date for fallback calculations
    let tenantCreatedAt: string | null = null;
    try {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("created_at")
        .eq("id", tenantId)
        .single();
      if (tenant) {
        tenantCreatedAt = tenant.created_at;
      }
    } catch (e) {
      // Ignore
    }

    // 2. Query the subscriptions table (most recent row)
    try {
      const { data: subs, error: subError } = await (supabase as any)
        .from("subscriptions")
        .select("status, plan_name, trial_ends_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1);

      const sub = subs?.[0];

      if (sub && !subError) {
        // If subscription row exists -> use its status value (default to 'trial' if nullish)
        const trialEndsAt = sub.trial_ends_at || (tenantCreatedAt 
          ? new Date(new Date(tenantCreatedAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        );
        const nowTime = new Date().getTime();
        const trialTime = new Date(trialEndsAt).getTime();
        const daysRemaining = Math.max(0, Math.ceil((trialTime - nowTime) / (1000 * 60 * 60 * 24)));

        return {
          status: sub.status ?? "trial",
          planName: (sub.plan_name as "starter" | "pro") || "starter",
          trialEndsAt,
          currentPeriodEnd: trialEndsAt,
          daysRemaining,
        };
      }
    } catch (e) {
      // Ignore subscriptions table query error (e.g. if it doesn't exist yet)
    }

    // 3. If NO subscription row found -> default to 'trial'
    const trialEndsAt = tenantCreatedAt 
      ? new Date(new Date(tenantCreatedAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    
    const nowTime = new Date().getTime();
    const trialTime = new Date(trialEndsAt).getTime();
    const daysRemaining = Math.max(0, Math.ceil((trialTime - nowTime) / (1000 * 60 * 60 * 24)));

    return {
      status: "trial",
      planName: "starter" as const,
      trialEndsAt,
      currentPeriodEnd: trialEndsAt,
      daysRemaining,
    };
  }),
});
