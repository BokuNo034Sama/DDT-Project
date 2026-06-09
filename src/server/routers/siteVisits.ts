import { z } from "zod";
import { router, managerProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
          type: "task_assigned",
          title: isLeader ? "Designated as Team Leader" : "New Site Visit Assigned",
          body: isLeader
            ? `You have been designated as the Team Leader for the site visit on ${input.visitDate} (Project ${project?.ndt_code || "Unknown"}).`
            : `You have been scheduled for a site visit on ${input.visitDate} (Project ${project?.ndt_code || "Unknown"}). Team Leader: ${leaderName || "None"}.`,
          related_project_id: input.projectId,
          is_read: false,
        };
      });

      await adminClient.from("notifications").insert(notificationsToInsert);

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
    .query(async ({ ctx, input }) => {
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
});
