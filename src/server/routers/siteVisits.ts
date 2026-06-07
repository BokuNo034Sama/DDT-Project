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
        .select("id")
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
      }));

      const { data, error } = await adminClient
        .from("site_visits")
        .insert(visitsToInsert)
        .select();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      // Automate Project Status Promotion on Site Visit
      const { data: projectRecord } = await adminClient
        .from("projects")
        .select("status")
        .eq("id", input.projectId)
        .single();

      if (projectRecord?.status === "not_started") {
        await adminClient
          .from("projects")
          .update({ status: "wip", updated_at: new Date().toISOString() })
          .eq("id", input.projectId);

        await adminClient.from("status_history").insert({
          project_id: input.projectId,
          tenant_id: activeTenantId,
          from_status: "not_started",
          to_status: "wip",
          changed_by: ctx.userId,
          notes: "Auto-advanced because a site visit was logged",
        });
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
    .query(async ({ ctx, input }) => {
      const adminClient = createAdminClient();

      const { data, error } = await adminClient
        .from("site_visits")
        .select(`
          *,
          staff_user:users!site_visits_staff_id_fkey (
            full_name
          )
        `)
        .eq("project_id", input.projectId)
        .order("visit_date", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),
});
