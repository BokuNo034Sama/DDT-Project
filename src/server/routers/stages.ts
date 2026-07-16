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

    const { data: assignments, error: assignmentsError } = await adminClient
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

    if (assignmentsError) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: assignmentsError.message });
    }

    // Pull active site visits where current user is scheduled
    const { data: visits, error: visitsError } = await adminClient
      .from("site_visits")
      .select(`
        id,
        project_id,
        visit_date,
        status,
        is_team_leader,
        started_at,
        completed_at,
        staff_id,
        project:projects (
          id,
          ndt_code,
          client_name,
          status,
          address,
          site_date,
          site_visit_logs (
            manager_instruction_note,
            team_lead_id
          )
        )
      `)
      .eq("staff_id", ctx.userId)
      .eq("tenant_id", activeTenantId)
      .in("status", ["pending", "in_progress"])
      .order("visit_date", { ascending: false });

    if (visitsError) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: visitsError.message });
    }

    // Format visits to align with the task card component
    const formattedVisits = (visits || []).map((v: any) => {
      const matchedLog = v.project?.site_visit_logs?.find(
        (l: any) => l.team_lead_id === v.staff_id
      );

      return {
        id: v.id,
        project_id: v.project_id,
        stage: "site_visit" as const,
        status: v.status,
        assigned_at: v.visit_date,
        visit_date: v.visit_date,
        is_team_leader: v.is_team_leader,
        started_at: v.started_at,
        completed_at: v.completed_at,
        project: {
          id: v.project?.id,
          ndt_code: v.project?.ndt_code,
          client_name: v.project?.client_name,
          status: v.project?.status,
          address: v.project?.address,
        },
        task_type: "site_visit" as const,
        assigned_by_user: null,
        manager_instruction_note: matchedLog?.manager_instruction_note || null,
      };
    });

    const formattedStages = (assignments || []).map((s: any) => ({
      ...s,
      task_type: "stage" as const,
      is_team_leader: false,
    }));

    // Merge and sort chronologically (newest first)
    const combined = [...formattedVisits, ...formattedStages].sort(
      (a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
    );

    return combined;
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

      // Get the existing assignee before upserting
      const { data: existingAssignment } = await adminClient
        .from("project_stage_assignments")
        .select("assigned_to")
        .eq("project_id", input.projectId)
        .eq("stage", input.stage)
        .maybeSingle();

      const oldAssigneeId = existingAssignment?.assigned_to;

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

      const projectCode = projectRes.data?.ndt_code || "Unknown";
      const notifications = [];

      const isDifferentPerson = oldAssigneeId && oldAssigneeId !== input.assignedTo;

      if (isDifferentPerson) {
        notifications.push({
          tenant_id: activeTenantId,
          user_id: oldAssigneeId,
          type: "task_assigned",
          title: "Task Reassigned",
          body: `The ${input.stage} task for ${projectCode} has been reassigned to another team member.`,
          related_project_id: input.projectId,
          is_read: false,
        });
      }

      if (input.assignedTo) {
        notifications.push({
          tenant_id: activeTenantId,
          user_id: input.assignedTo,
          type: "task_assigned",
          title: "New Task Assigned",
          body: `You have been assigned the ${input.stage} task for ${projectCode}. Please start when ready.`,
          related_project_id: input.projectId,
          is_read: false,
        });
      }

      if (notifications.length > 0) {
        await adminClient.from("notifications").insert(notifications);
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
        .select("*")
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

      // A. Update Assignment State
      const { error: updateError } = await adminClient
        .from("project_stage_assignments")
        .update({
          completed_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", input.stageAssignmentId);

      if (updateError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: updateError.message });
      }

      // B. Advance Parent Project Status
      const { data: projectRecord, error: projectError } = await adminClient
        .from("projects")
        .select("status, ndt_code")
        .eq("id", assignment.project_id)
        .single();

      if (projectError || !projectRecord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Parent project not found" });
      }

      let nextProjectStatus: string | null = null;
      if (assignment.stage === "analysis") {
        nextProjectStatus = "analysis_done";
      } else if (assignment.stage === "sketch") {
        nextProjectStatus = "sketch_done";
      } else if (assignment.stage === "report_writing") {
        nextProjectStatus = "report_done";
      }

      if (nextProjectStatus && nextProjectStatus !== projectRecord.status) {
        const { error: updateProjectError } = await adminClient
          .from("projects")
          .update({
            status: nextProjectStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", assignment.project_id);

        if (updateProjectError) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update project status" });
        }

        // C. Append Audit Trail (status_history)
        const { error: historyError } = await adminClient
          .from("status_history")
          .insert({
            project_id: assignment.project_id,
            tenant_id: assignment.tenant_id,
            from_status: projectRecord.status,
            to_status: nextProjectStatus,
            changed_by: ctx.userId,
            notes: `Auto-advanced because stage ${assignment.stage} was completed`,
          });

        if (historyError) {
          console.error("Failed to append status history:", historyError);
        }
      }

      // C. Managers Notification (notifications)
      const { error: notificationError } = await adminClient
        .from("notifications")
        .insert({
          tenant_id: assignment.tenant_id,
          user_id: assignment.assigned_by, // Notify the manager who assigned it
          type: "stage_completed",
          title: `Task Completed: ${assignment.stage}`,
          body: `Stage ${assignment.stage} completed for project ${projectRecord.ndt_code}.`,
          related_project_id: assignment.project_id,
          is_read: false,
        });

      if (notificationError) {
        console.error("Failed to insert notification:", notificationError);
      }

      return { success: true };
    }),
});
