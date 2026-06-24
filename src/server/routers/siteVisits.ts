import { z } from "zod";
import { router, managerProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification } from "@/lib/notifications/push";

export const siteVisitsRouter = router({
  // Log staff site attendance
  add: managerProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        staffIds: z.array(z.string().uuid()).min(1),
        visitDate: z.string(), // ISO date string
        numberOfFloors: z.number().optional(),
        leaderStaffId: z.string().uuid().optional(),
        managerInstructionNote: z.string().optional(),
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

      // Verify project exists in this tenant
      const { data: project, error: projectError } = await adminClient
        .from("projects")
        .select("id, ndt_code, client_name")
        .eq("id", input.projectId)
        .eq("tenant_id", activeTenantId)
        .single();

      if (projectError || !project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const visitsToInsert = input.staffIds.map((staffId) => ({
        project_id: input.projectId,
        tenant_id: activeTenantId,
        staff_id: staffId,
        visit_date: input.visitDate,
        number_of_floors: input.numberOfFloors ?? null,
        created_by: ctx.userId,
        is_team_leader: staffId === input.leaderStaffId,
        status: "pending",
      }));

      const { data, error } = await adminClient
        .from("site_visits")
        .insert(visitsToInsert)
        .select();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      // Send dispatch notifications to all attending staff members
      let leaderName = "";
      if (input.leaderStaffId) {
        const { data: leaderUser } = await adminClient
          .from("users")
          .select("full_name")
          .eq("id", input.leaderStaffId)
          .single();
        leaderName = leaderUser?.full_name || "";
      }

      const notificationsToInsert = input.staffIds.map((staffId) => {
        const isLeader = staffId === input.leaderStaffId;
        return {
          tenant_id: activeTenantId,
          user_id: staffId,
          type: "site_inspection",
          title: isLeader ? "Designated as Team Leader" : "New Site Visit Assigned",
          body: isLeader
            ? `You have been designated as the Team Leader for the site visit on ${input.visitDate} (Project ${project?.ndt_code || "Unknown"}).`
            : `You have been scheduled for a site visit on ${input.visitDate} (Project ${project?.ndt_code || "Unknown"}). Team Leader: ${leaderName || "None"}.`,
          related_project_id: input.projectId,
          is_read: false,
        };
      });

      await adminClient.from("notifications").insert(notificationsToInsert);

      // Create inspection log entry for the Team Leader
      if (input.leaderStaffId) {
        const { error: logError } = await adminClient
          .from("site_visit_logs")
          .insert({
            project_id: input.projectId,
            tenant_id: activeTenantId,
            team_lead_id: input.leaderStaffId,
            manager_id: ctx.userId,
            manager_instruction_note: input.managerInstructionNote || null,
            status: "assigned",
          });
        if (logError) {
          console.error("Failed to create site_visit_logs entry:", logError);
        }
      }

      return data;
    }),

  // Remove staff site attendance
  remove: managerProcedure
    .input(z.object({ siteVisitId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;
      const { error } = await supabase
        .from("site_visits")
        .delete()
        .eq("id", input.siteVisitId)
        .eq("tenant_id", tenantId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),

  // List site visits by project ID
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input }) => {
      const adminClient = createAdminClient();

      const { data: visits, error } = await adminClient
        .from('site_visits')
        .select(`
          *,
          staff_user:users!site_visits_staff_id_fkey (
            full_name
          )
        `)
        .eq('project_id', input.projectId)
        .order('visit_date', { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return visits;
    }),

  // Start a site visit
  start: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        visitDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      // Look up site visit row for logged-in user to verify Team Leader role
      const { data: userVisit, error: lookupError } = await adminClient
        .from("site_visits")
        .select("is_team_leader")
        .eq("project_id", input.projectId)
        .eq("visit_date", input.visitDate)
        .eq("staff_id", ctx.userId)
        .maybeSingle();

      if (lookupError || !userVisit || !userVisit.is_team_leader) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the designated Team Leader can alter field task status.",
        });
      }

      const now = new Date().toISOString();
      const { error: updateError } = await adminClient
        .from("site_visits")
        .update({
          status: "in_progress",
          started_at: now,
        })
        .eq("project_id", input.projectId)
        .eq("visit_date", input.visitDate);

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: updateError.message,
        });
      }

      return { success: true };
    }),

  // Complete a site visit
  complete: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        visitDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      // Look up site visit row for logged-in user to verify Team Leader role
      const { data: userVisit, error: lookupError } = await adminClient
        .from("site_visits")
        .select("is_team_leader, tenant_id")
        .eq("project_id", input.projectId)
        .eq("visit_date", input.visitDate)
        .eq("staff_id", ctx.userId)
        .maybeSingle();

      if (lookupError || !userVisit || !userVisit.is_team_leader) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the designated Team Leader can alter field task status.",
        });
      }

      const now = new Date().toISOString();
      const { error: updateError } = await adminClient
        .from("site_visits")
        .update({
          status: "completed",
          completed_at: now,
        })
        .eq("project_id", input.projectId)
        .eq("visit_date", input.visitDate);

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: updateError.message,
        });
      }

      // Advance parent project status to wip if it is currently not_started
      const { data: projectRecord } = await adminClient
        .from("projects")
        .select("status")
        .eq("id", input.projectId)
        .single();

      if (projectRecord?.status === "not_started" && userVisit.tenant_id) {
        await adminClient
          .from("projects")
          .update({ status: "wip", updated_at: now })
          .eq("id", input.projectId);

        await adminClient.from("status_history").insert({
          project_id: input.projectId,
          tenant_id: userVisit.tenant_id,
          from_status: "not_started",
          to_status: "wip",
          changed_by: ctx.userId,
          notes: "Auto-advanced because site inspection was completed by the Team Leader",
        });
      }

      return { success: true };
    }),

  assignVisitInstruction: managerProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        managerInstructionNote: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      // Get tenant id
      const profile = await adminClient
        .from("users")
        .select("tenant_id")
        .eq("id", ctx.userId)
        .single();
      const activeTenantId = profile.data?.tenant_id;
      if (!activeTenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "User tenant not found" });
      }

      // 1. Find the active site_visit_logs row
      const { data: existingLog } = await adminClient
        .from("site_visit_logs")
        .select("id, team_lead_id")
        .eq("project_id", input.projectId)
        .eq("status", "assigned")
        .maybeSingle();

      let teamLeadId: string | null = null;
      
      if (existingLog) {
        teamLeadId = existingLog.team_lead_id;
        const { error: updateError } = await adminClient
          .from("site_visit_logs")
          .update({
            manager_instruction_note: input.managerInstructionNote,
            manager_id: ctx.userId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingLog.id);
        
        if (updateError) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: updateError.message });
        }
      } else {
        // Find team leader in scheduled site visits
        const { data: leadVisit } = await adminClient
          .from("site_visits")
          .select("staff_id")
          .eq("project_id", input.projectId)
          .eq("is_team_leader", true)
          .order("visit_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!leadVisit) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No designated Team Leader found for this project to assign instructions to."
          });
        }

        teamLeadId = leadVisit.staff_id;

        const { error: insertError } = await adminClient
          .from("site_visit_logs")
          .insert({
            project_id: input.projectId,
            tenant_id: activeTenantId,
            team_lead_id: leadVisit.staff_id,
            manager_id: ctx.userId,
            manager_instruction_note: input.managerInstructionNote,
            status: "assigned",
          });

        if (insertError) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: insertError.message });
        }
      }

      // Dispatch Web Push notification to the Team Leader
      if (teamLeadId) {
        try {
          await sendPushNotification({
            userId: teamLeadId,
            tenantId: activeTenantId,
            title: "New Site Visit Instructions",
            body: input.managerInstructionNote.length > 60 
              ? input.managerInstructionNote.substring(0, 57) + "..."
              : input.managerInstructionNote,
            url: "/dashboard",
          });
        } catch (pushErr) {
          console.error("Failed to send push notification:", pushErr);
        }
      }

      return { success: true };
    }),

  submitInspectionLog: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        visitDate: z.string(),
        fieldNotes: z.string().min(1),
        images: z.array(
          z.object({
            url: z.string(),
            type: z.string(),
            capturedAt: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();
      const now = new Date().toISOString();

      // Get user tenant
      const profile = await adminClient
        .from("users")
        .select("tenant_id")
        .eq("id", ctx.userId)
        .single();
      const activeTenantId = profile.data?.tenant_id;
      if (!activeTenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "User tenant not found" });
      }

      // Look up site visit row for logged-in user to verify Team Leader role
      const { data: userVisit, error: lookupError } = await adminClient
        .from("site_visits")
        .select("is_team_leader")
        .eq("project_id", input.projectId)
        .eq("visit_date", input.visitDate)
        .eq("staff_id", ctx.userId)
        .maybeSingle();

      if (lookupError || !userVisit || !userVisit.is_team_leader) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the designated Team Leader can submit the inspection log.",
        });
      }

      // 1. Find active log row
      const { data: logRow } = await adminClient
        .from("site_visit_logs")
        .select("id, manager_id")
        .eq("project_id", input.projectId)
        .eq("status", "assigned")
        .maybeSingle();

      if (!logRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active site visit log not found for assignment. Please ensure a team leader is assigned.",
        });
      }

      // 2. Update site_visits table
      const { error: visitUpdateError } = await adminClient
        .from("site_visits")
        .update({
          status: "completed",
          completed_at: now,
        })
        .eq("project_id", input.projectId)
        .eq("visit_date", input.visitDate);

      if (visitUpdateError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: visitUpdateError.message });
      }

      // 3. Update site_visit_logs table
      const { error: logUpdateError } = await adminClient
        .from("site_visit_logs")
        .update({
          status: "completed",
          field_notes: input.fieldNotes,
          images: input.images as any,
          completed_at: now,
          updated_at: now,
        })
        .eq("id", logRow.id);

      if (logUpdateError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: logUpdateError.message });
      }

      // 4. Advance parent project status to wip if it is currently not_started
      const { data: projectRecord } = await adminClient
        .from("projects")
        .select("status, ndt_code, created_by")
        .eq("id", input.projectId)
        .single();

      if (projectRecord?.status === "not_started") {
        await adminClient
          .from("projects")
          .update({ status: "wip", updated_at: now })
          .eq("id", input.projectId);

        await adminClient.from("status_history").insert({
          project_id: input.projectId,
          tenant_id: activeTenantId,
          from_status: "not_started",
          to_status: "wip",
          changed_by: ctx.userId,
          notes: "Auto-advanced because site inspection was completed by the Team Leader",
        });
      }

      // 5. Insert notification for the assigning manager
      const notifyUserId = logRow.manager_id || projectRecord?.created_by;
      if (notifyUserId) {
        await adminClient.from("notifications").insert({
          tenant_id: activeTenantId,
          user_id: notifyUserId,
          type: "site_inspection",
          title: "Site Inspection Completed",
          body: `Team Leader completed the inspection log for project ${projectRecord?.ndt_code || "Unknown"}.`,
          related_project_id: input.projectId,
          is_read: false,
        });
      }

      return { success: true };
    }),

  getInspectionDataByProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const adminClient = createAdminClient();

      const { data: logs, error } = await adminClient
        .from("site_visit_logs")
        .select(`
          *,
          team_lead_user:users!site_visit_logs_team_lead_id_fkey (id, full_name, role),
          manager_user:users!site_visit_logs_manager_id_fkey (id, full_name, role)
        `)
        .eq("project_id", input.projectId)
        .order("completed_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return logs;
    }),

  reassignStaff: managerProcedure
    .input(
      z.object({
        siteVisitId: z.string().uuid(),
        newStaffId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      const profile = await adminClient
        .from("users")
        .select("tenant_id")
        .eq("id", ctx.userId)
        .single();
      const activeTenantId = profile.data?.tenant_id;
      if (!activeTenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "User tenant not found" });
      }

      // 1. Fetch current site visit
      const { data: visit, error: fetchError } = await adminClient
        .from("site_visits")
        .select("*")
        .eq("id", input.siteVisitId)
        .eq("tenant_id", activeTenantId)
        .single();

      if (fetchError || !visit) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Site visit not found" });
      }

      const oldStaffId = visit.staff_id;

      // 2. If it is the team leader, update active log
      if (visit.is_team_leader) {
        const { data: log } = await adminClient
          .from("site_visit_logs")
          .select("id")
          .eq("project_id", visit.project_id)
          .eq("team_lead_id", oldStaffId)
          .eq("status", "assigned")
          .maybeSingle();

        if (log) {
          await adminClient
            .from("site_visit_logs")
            .update({
              team_lead_id: input.newStaffId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", log.id);
        }
      }

      // 3. Update the site_visits staff_id
      const { data: updated, error: updateError } = await adminClient
        .from("site_visits")
        .update({
          staff_id: input.newStaffId,
        })
        .eq("id", input.siteVisitId)
        .select()
        .single();

      if (updateError || !updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: updateError?.message || "Failed to reassign staff",
        });
      }

      // Dispatch Web Push notification to the new staff member
      try {
        await sendPushNotification({
          userId: input.newStaffId,
          tenantId: activeTenantId,
          title: visit.is_team_leader ? "Designated as Team Leader" : "New Site Visit Assigned",
          body: visit.is_team_leader
            ? `You have been designated as the Team Leader for the site visit on ${visit.visit_date}.`
            : `You have been scheduled for a site visit on ${visit.visit_date}.`,
          url: "/dashboard",
        });
      } catch (pushErr) {
        console.error("Failed to send push notification:", pushErr);
      }

      return updated;
    }),

  deleteEntireSiteVisit: managerProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        visitDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      const profile = await adminClient
        .from("users")
        .select("tenant_id")
        .eq("id", ctx.userId)
        .single();
      const activeTenantId = profile.data?.tenant_id;
      if (!activeTenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "User tenant not found" });
      }

      // 1. Delete all site visits on this date for this project
      const { error: deleteVisitsError } = await adminClient
        .from("site_visits")
        .delete()
        .eq("project_id", input.projectId)
        .eq("visit_date", input.visitDate)
        .eq("tenant_id", activeTenantId);

      if (deleteVisitsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: deleteVisitsError.message,
        });
      }

      // 2. Delete corresponding log entries
      await adminClient
        .from("site_visit_logs")
        .delete()
        .eq("project_id", input.projectId)
        .eq("status", "assigned")
        .eq("tenant_id", activeTenantId);

      return { success: true };
    }),
});
