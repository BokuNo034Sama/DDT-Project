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
});
