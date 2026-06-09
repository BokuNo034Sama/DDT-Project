import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  saveSubscription: protectedProcedure
    .input(z.object({
      endpoint: z.string(),
      auth: z.string(),
      p256dh: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient()
      
      // Get tenant_id from users table
      const { data: user } = await adminClient
        .from('users')
        .select('tenant_id')
        .eq('id', ctx.userId)
        .single()
      
      console.log('Saving for user:', ctx.userId)
      console.log('Tenant:', user?.tenant_id)
      
      const { error } = await adminClient
        .from('user_push_subscriptions')
        .upsert({
          user_id: ctx.userId,
          tenant_id: user?.tenant_id,
          endpoint: input.endpoint,
          auth_key: input.auth,
          p256dh_key: input.p256dh,
        }, {
          onConflict: 'endpoint'
        })
      
      if (error) {
        console.error('DB insert error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        })
      }
      
      return { success: true }
    }),

  savePushSubscription: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        auth_key: z.string(),
        p256dh_key: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId, userId } = ctx;

      const { data, error } = await supabase
        .from("user_push_subscriptions")
        .upsert(
          {
            user_id: userId,
            tenant_id: tenantId,
            endpoint: input.endpoint,
            p256dh_key: input.p256dh_key,
            auth_key: input.auth_key,
            created_at: new Date().toISOString(),
          },
          {
            onConflict: "endpoint",
          }
        )
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  removeSubscription: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, userId } = ctx;

      const { error } = await supabase
        .from("user_push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", input.endpoint);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),
});
