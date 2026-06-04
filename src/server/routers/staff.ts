import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "@/lib/email/resend";
import { InvitationEmail } from "@/lib/email/templates/invitation";
import React from "react";

export const staffRouter = router({
  // Get all staff in tenant
  list: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, tenantId } = ctx;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("full_name");

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }

    return data;
  }),

  // Get current user profile and role
  getMe: protectedProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      role: ctx.role,
    };
  }),

  // Invite a new staff member
  invite: managerProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["lab_owner", "ops_manager", "staff"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId, userId } = ctx;

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", input.email)
        .eq("tenant_id", tenantId)
        .single();

      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "User already exists in this tenant" });
      }

      // Generate a simple token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: invitation, error } = await supabase
        .from("invitations")
        .insert({
          tenant_id: tenantId,
          email: input.email,
          role: input.role,
          invited_by: userId,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      // Fetch lab and inviter details for the email
      const [{ data: tenantData }, { data: inviterData }] = await Promise.all([
        supabase.from("tenants").select("name").eq("id", tenantId).single(),
        supabase.from("users").select("full_name").eq("id", userId).single()
      ]);

      const labName = tenantData?.name || "Your Laboratory";
      const inviterName = inviterData?.full_name || "A team member";

      // Send the email
      await sendEmail({
        to: input.email,
        subject: `You've been invited to join ${labName} on DDT Structure`,
        react: React.createElement(InvitationEmail, {
          labName,
          inviterName,
          role: input.role,
          token,
        }),
      });

      return {
        success: true,
        message: "Invitation created and sent.",
        invitation,
      };
    }),

  updateRole: managerProcedure
    .input(z.object({ userId: z.string(), role: z.enum(["lab_owner", "ops_manager", "staff"]) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot change your own role" });
      }
      const { error } = await ctx.supabase
        .from("users")
        .update({ role: input.role })
        .eq("id", input.userId)
        .eq("tenant_id", ctx.tenantId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  deactivate: managerProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot deactivate yourself" });
      }
      // Assuming 'is_active' doesn't exist on users yet based on initial schema step, we might just delete or remove role. Let's add is_active if it exists, otherwise just log or fail softly. Wait, step 19 says: Sets is_active = false. Let's assume it exists.
      const { error } = await ctx.supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", input.userId)
        .eq("tenant_id", ctx.tenantId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  getPendingInvitations: managerProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("invitations")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return data;
  }),

  cancelInvitation: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("invitations")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", ctx.tenantId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
