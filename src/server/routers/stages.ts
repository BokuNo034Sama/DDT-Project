import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const stagesRouter = router({
  // Get active stage assignments for current user
  getMyStages: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, tenantId, userId } = ctx;

    const { data, error } = await supabase
      .from("project_stage_assignments")
      .select(`
        *,
        project:projects (
          id,
          ndt_code,
          client_name,
          status,
          address,
          site_date
        ),
        assigned_by_user:users!project_stage_assignments_assigned_by_fkey (
          id,
          full_name,
          role
        )
      `)
      .eq("assigned_to", userId)
      .eq("tenant_id", tenantId)
      .in("status", ["pending", "in_progress"])
      .order("assigned_at", { ascending: false });

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }

    return data;
  }),

  // Assign a stage to a staff member
  assign: managerProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        stage: z.enum(["analysis", "sketch", "report_writing", "proofreading"]),
        assignedTo: z.string().uuid().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      // Resolve the True Tenant Context
      const profile = await adminClient
        .from("users")
        .select("tenant_id")
        .eq("id", ctx.userId)
        .single();

      const activeTenantId = profile.data?.tenant_id;

      if (!activeTenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "User tenant not found" });
      }

      // Upsert the assignment (using the unique constraint on project_id + stage)
      const { data, error } = await adminClient
        .from("project_stage_assignments")
        .upsert(
          {
            project_id: input.projectId,
            tenant_id: activeTenantId,
            stage: input.stage,
            assigned_to: input.assignedTo,
            assigned_by: ctx.userId,
            assigned_at: new Date().toISOString(),
            status: "pending",
          },
          { onConflict: "project_id, stage" }
        )
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      // If assigned to a user, create a notification
      if (input.assignedTo) {
        await adminClient.from("notifications").insert({
          tenant_id: activeTenantId,
          user_id: input.assignedTo,
          type: "task_assigned",
          title: `New Task: ${input.stage}`,
          body: `You have been assigned to the ${input.stage} stage.`,
          related_project_id: input.projectId,
        });
      }

      return data;
    }),

  // Record start time for a stage
  start: protectedProcedure
    .input(
      z.object({
        assignmentId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId, userId } = ctx;

      const { data: assignment, error: checkError } = await supabase
        .from("project_stage_assignments")
        .select("*")
        .eq("id", input.assignmentId)
        .eq("tenant_id", tenantId)
        .single();

      if (checkError || !assignment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found" });
      }

      if (assignment.assigned_to !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not assigned to this task" });
      }

      const { data, error } = await supabase
        .from("project_stage_assignments")
        .update({
          started_at: new Date().toISOString(),
          status: "in_progress",
        })
        .eq("id", input.assignmentId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      // Automatically advance project to WIP if it's currently not_started
      const { data: project } = await supabase
        .from("projects")
        .select("status")
        .eq("id", assignment.project_id)
        .single();

      if (project?.status === "not_started") {
        await supabase
          .from("projects")
          .update({ status: "wip", updated_at: new Date().toISOString() })
          .eq("id", assignment.project_id);
          
        await supabase.from("status_history").insert({
          project_id: assignment.project_id,
          tenant_id: tenantId,
          from_status: "not_started",
          to_status: "wip",
          changed_by: userId,
          notes: "Auto-advanced because a stage was started",
        });
      }

      return data;
    }),

  // Mark a stage as complete
  complete: protectedProcedure
    .input(
      z.object({
        assignmentId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId, userId } = ctx;

      const { data: assignment, error: checkError } = await supabase
        .from("project_stage_assignments")
        .select("*, projects(ndt_code)")
        .eq("id", input.assignmentId)
        .eq("tenant_id", tenantId)
        .single();

      if (checkError || !assignment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found" });
      }

      if (assignment.assigned_to !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not assigned to this task" });
      }

      const { data, error } = await supabase
        .from("project_stage_assignments")
        .update({
          completed_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", input.assignmentId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      // Notify Ops Manager
      await supabase.from("notifications").insert({
        tenant_id: tenantId,
        user_id: assignment.assigned_by, // Notify the manager who assigned it
        type: "stage_completed",
        title: `Task Completed: ${assignment.stage}`,
        body: `Stage ${assignment.stage} completed for project ${assignment.projects?.ndt_code}.`,
        related_project_id: assignment.project_id,
      });

      // Call the RPC function to auto-advance the project status based on the completed stage
      // The PRD specifies advance_project_status(p_project_id, p_stage)
      await supabase.rpc("advance_project_status", {
        p_project_id: assignment.project_id,
        p_stage: assignment.stage,
      });

      return data;
    }),
});
