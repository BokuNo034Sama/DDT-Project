import { z } from "zod";
import { router, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification } from "@/lib/notifications/push";

export const tasksRouter = router({
  reassignTask: managerProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        newStaffId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      // Resolve the true active tenant directly from database profile
      const profile = await adminClient
        .from("users")
        .select("tenant_id")
        .eq("id", ctx.userId)
        .single();

      const activeTenantId = profile.data?.tenant_id || ctx.tenantId;

      if (!activeTenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "User tenant not found" });
      }

      // Query the current task assignment row to identify the previous staff owner ID
      const { data: assignment, error: fetchError } = await adminClient
        .from("project_stage_assignments")
        .select("*")
        .eq("id", input.taskId)
        .single();

      if (fetchError || !assignment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found" });
      }

      // Enforce tenant isolation
      if (assignment.tenant_id !== activeTenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to access this assignment" });
      }

      const previousStaffId = assignment.assigned_to;

      // Update the task's assigned_to foreign key to the newStaffId
      const { data: updated, error: updateError } = await adminClient
        .from("project_stage_assignments")
        .update({
          assigned_to: input.newStaffId,
          assigned_by: ctx.userId,
          assigned_at: new Date().toISOString(),
          // Reset status to pending when reassigning so the new assignee can start fresh
          status: "pending",
          started_at: null,
          completed_at: null,
        })
        .eq("id", input.taskId)
        .select()
        .single();

      if (updateError || !updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: updateError?.message || "Failed to update assignment",
        });
      }

      // Push Sync: Fire dual Web Push notification payload
      // 1. Send revocation push payload to the previous staff member if assigned and different
      if (previousStaffId && previousStaffId !== input.newStaffId) {
        try {
          await sendPushNotification({
            userId: previousStaffId,
            tenantId: activeTenantId,
            title: "Task Revoked",
            body: "A task has been reassigned and removed from your dashboard.",
            url: "/dashboard",
          });
        } catch (pushErr) {
          console.error("Failed sending revocation push notification:", pushErr);
        }
      }

      // 2. Send onboarding push banner notification to the new staff member
      try {
        await sendPushNotification({
          userId: input.newStaffId,
          tenantId: activeTenantId,
          title: "New Task Assigned",
          body: "Abeg, check your dashboard for details.",
          url: "/dashboard",
        });
      } catch (pushErr) {
        console.error("Failed sending onboarding push notification:", pushErr);
      }

      return updated;
    }),

  deleteTaskAssignment: managerProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      // Resolve active tenant
      const profile = await adminClient
        .from("users")
        .select("tenant_id")
        .eq("id", ctx.userId)
        .single();

      const activeTenantId = profile.data?.tenant_id || ctx.tenantId;

      if (!activeTenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "User tenant not found" });
      }

      // Query task row first to get the active staff owner ID
      const { data: assignment, error: fetchError } = await adminClient
        .from("project_stage_assignments")
        .select("*")
        .eq("id", input.taskId)
        .single();

      if (fetchError || !assignment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found" });
      }

      // Enforce tenant isolation
      if (assignment.tenant_id !== activeTenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to access this assignment" });
      }

      const activeStaffId = assignment.assigned_to;

      // Delete the task assignment row
      const { error: deleteError } = await adminClient
        .from("project_stage_assignments")
        .delete()
        .eq("id", input.taskId);

      if (deleteError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: deleteError.message,
        });
      }

      // Push Sync: Send revocation web push data frame to active staff owner
      if (activeStaffId) {
        try {
          await sendPushNotification({
            userId: activeStaffId,
            tenantId: activeTenantId,
            title: "Task Revoked",
            body: "A task has been removed from your dashboard.",
            url: "/dashboard",
          });
        } catch (pushErr) {
          console.error("Failed sending revocation push notification:", pushErr);
        }
      }

      return { success: true };
    }),
});
