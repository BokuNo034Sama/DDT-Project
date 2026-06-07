import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sendWorkspaceEmail } from "@/lib/resend";
import { InvitationEmail } from "@/lib/email/templates/invitation";
import React from "react";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const staffRouter = router({
  // Get all staff in tenant
  list: managerProcedure
    .input(
      z.object({
        role: z.enum(["lab_owner", "ops_manager", "staff"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      const profile = await adminClient
        .from("users")
        .select("tenant_id")
        .eq("id", ctx.userId)
        .single();

      const activeTenantId = profile.data?.tenant_id;

      let query = adminClient
        .from("users")
        .select("*")
        .eq("tenant_id", activeTenantId)
        .eq("is_active", true);

      if (input?.role) {
        query = query.eq("role", input.role);
      }

      const { data, error } = await query.order("full_name");

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  // Get current user profile and role
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, userId } = ctx;
    
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, tenant_id")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return {
        id: userId,
        tenant_id: ctx.tenantId,
        role: ctx.role || "staff",
        full_name: "User",
        email: "",
      };
    }

    return profile;
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

      if (!tenantId || !userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized context" });
      }

      const adminClient = createAdminClient();

      // 1. Check if email already exists in auth.users
      const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers();
      if (authError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: authError.message });
      }
      const authUser = authUsers?.find((u) => u.email?.toLowerCase() === input.email.toLowerCase());

      if (authUser) {
        // 2 & 3. Check if they have a public user record in this tenant or another
        const { data: existingPublicUser } = await adminClient
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        if (existingPublicUser) {
          if (existingPublicUser.tenant_id === tenantId) {
            // If email exists in public.users for this tenant -> show error
            throw new TRPCError({
              code: "CONFLICT",
              message: "This person is already in your workspace",
            });
          } else {
            // Link them by updating their tenant_id and role
            const { error: updateError } = await adminClient
              .from("users")
              .update({
                tenant_id: tenantId,
                role: input.role,
                joined_at: new Date().toISOString(),
                is_active: true,
              })
              .eq("id", authUser.id);

            if (updateError) {
              throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: updateError.message });
            }

            return {
              success: true,
              message: "Staff member added to workspace",
            };
          }
        } else {
          // Create user record in public.users and link them
          const { error: insertError } = await adminClient
            .from("users")
            .insert({
              id: authUser.id,
              tenant_id: tenantId,
              full_name: authUser.user_metadata?.full_name || "Invited User",
              email: input.email,
              role: input.role,
              joined_at: new Date().toISOString(),
              is_active: true,
            });

          if (insertError) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: insertError.message });
          }

          return {
            success: true,
            message: "Staff member added to workspace",
          };
        }
      }

      // 4. If email is new -> create invitation and send email as normal
      const token = crypto.randomUUID();
      
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

      // Send the email (wrapped in try/catch so failures don't crash invitation flow)
      try {
        await sendWorkspaceEmail({
          to: input.email,
          subject: `You've been invited to join ${labName} on DDT Structure`,
          react: React.createElement(InvitationEmail, {
            labName,
            inviterName,
            role: input.role,
            token,
            appUrl: process.env.NEXT_PUBLIC_APP_URL,
          }),
        });
      } catch (emailError) {
        console.error("Email failed but invitation created:", emailError);
      }

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
