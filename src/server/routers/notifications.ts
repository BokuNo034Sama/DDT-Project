import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const notificationsRouter = router({
  // Get current user's notifications
  list: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, tenantId, userId } = ctx;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50); // limit to recent notifications

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }

    return data;
  }),

  // Mark notification(s) as read
  markRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string().uuid().optional(), // if not provided, marks all as read
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId, userId } = ctx;

      let query = supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .eq("is_read", false);

      if (input.notificationId) {
        query = query.eq("id", input.notificationId);
      }

      const { error } = await query;

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),
});
