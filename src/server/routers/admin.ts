import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
  // Get all tenants
  listTenants: adminProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx;

    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }

    return data;
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
      const { supabase } = ctx;

      const { data, error } = await supabase
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
});
