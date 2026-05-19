import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

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

      // Generate a simple token (in production, use a more secure method like crypto.randomBytes)
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

      // TODO: Integrate Resend to actually send the email.
      // For now, log the invite link for development purposes.
      console.log(`[INVITATION CREATED] Link: http://localhost:3000/accept-invite?token=${token}`);

      return {
        success: true,
        message: "Invitation created.",
        invitation,
      };
    }),
});
