import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const stagesRouter = router({
  // Get active stage assignments for current user
  getMyStages: protectedProcedure.query(async ({ ctx }) => {
    const adminClient = createAdminClient();

    // Resolve the true active tenant directly from database profile
    const profile = await adminClient
      .from("users")
      .select("tenant_id")
      .eq("id", ctx.userId)
      .single();

    const activeTenantId = profile.data?.tenant_id || ctx.tenantId;

    const { data, error } = await adminClient
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
      .eq("assigned_to", ctx.userId)
      .eq("tenant_id", activeTenantId)
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

      // Upsert the assignment (using the unique constraint on project_id + stage) and retrieve project details concurrently
      const [assignmentRes, projectRes] = await Promise.all([
        adminClient
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
          .single(),
        adminClient
          .from("projects")
          .select("ndt_code")
          .eq("id", input.projectId)
          .single()
      ]);

      if (assignmentRes.error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: assignmentRes.error.message });
      }

      // If assigned to a user, create a notification
      if (input.assignedTo) {
        const projectCode = projectRes.data?.ndt_code || "Unknown";
        const stageLabel = input.stage.split("_").map((w, idx) => idx === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(" ");

        await adminClient.from("notifications").insert({
          tenant_id: activeTenantId,
          user_id: input.assignedTo,
          type: "task_assigned",
          title: "New Task Assigned",
          body: `You have been assigned to the ${stageLabel} stage for project ${projectCode}`,
          related_project_id: input.projectId,
          is_read: false,
        });
      }

      return assignmentRes.data;
    }),

  // Record start time for a stage
  start: protectedProcedure
    .input(z.object({ stageAssignmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();
      
      // Look up assignment using adminClient
      const { data: assignment, error } = await adminClient
        .from("project_stage_assignments")
        .select("*, projects(tenant_id)")
        .eq("id", input.stageAssignmentId)
        .single();
      
      if (error || !assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }
      
      // Verify ownership or manager role
      const isOwner = assignment.assigned_to === ctx.userId;
      const isManager = ["ops_manager", "lab_owner", "super_admin"].includes(ctx.role ?? "");
      
      if (!isOwner && !isManager) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to start this task",
        });
      }
      
      // Update started_at using adminClient
      const { error: updateError } = await adminClient
        .from("project_stage_assignments")
        .update({ 
          started_at: new Date().toISOString(),
          status: "in_progress",
        })
        .eq("id", input.stageAssignmentId);
      
      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start task",
        });
      }
      
      // Automatically advance project to WIP if it's currently not_started
      const { data: projectRecord } = await adminClient
        .from("projects")
        .select("status")
        .eq("id", assignment.project_id)
        .single();

      if (projectRecord?.status === "not_started") {
        await adminClient
          .from("projects")
          .update({ status: "wip", updated_at: new Date().toISOString() })
          .eq("id", assignment.project_id);
          
        await adminClient.from("status_history").insert({
          project_id: assignment.project_id,
          tenant_id: assignment.tenant_id,
          from_status: "not_started",
          to_status: "wip",
          changed_by: ctx.userId,
          notes: "Auto-advanced because a stage was started",
        });
      }
      
      return { success: true };
    }),

  // Mark a stage as complete
  complete: protectedProcedure
    .input(z.object({ stageAssignmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      const { data: assignment, error: checkError } = await adminClient
        .from("project_stage_assignments")
        .select("*, projects(ndt_code)")
        .eq("id", input.stageAssignmentId)
        .single();

      if (checkError || !assignment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found" });
      }

      // Verify ownership or manager role
      const isOwner = assignment.assigned_to === ctx.userId;
      const isManager = ["ops_manager", "lab_owner", "super_admin"].includes(ctx.role ?? "");

      if (!isOwner && !isManager) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to complete this task" });
      }

      const { data, error } = await adminClient
        .from("project_stage_assignments")
        .update({
          completed_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", input.stageAssignmentId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      // Notify Ops Manager
      await adminClient.from("notifications").insert({
        tenant_id: assignment.tenant_id,
        user_id: assignment.assigned_by, // Notify the manager who assigned it
        type: "stage_completed",
        title: `Task Completed: ${assignment.stage}`,
        body: `Stage ${assignment.stage} completed for project ${assignment.projects?.ndt_code}.`,
        related_project_id: assignment.project_id,
        is_read: false,
      });

      // Call the RPC function to auto-advance the project status based on the completed stage
      await adminClient.rpc("advance_project_status", {
        p_project_id: assignment.project_id,
        p_stage: assignment.stage,
      });

      return { success: true };
    }),
});
