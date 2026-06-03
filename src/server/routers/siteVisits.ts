import { z } from "zod";
import { router, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

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
      const { supabase, tenantId, userId } = ctx;

      // Verify project exists in this tenant
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", input.projectId)
        .eq("tenant_id", tenantId)
        .single();

      if (projectError || !project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const visitsToInsert = input.staffIds.map((staffId) => ({
        project_id: input.projectId,
        tenant_id: tenantId,
        staff_id: staffId,
        visit_date: input.visitDate,
        number_of_floors: input.numberOfFloors ?? null,
        created_by: userId,
      }));

      const { data, error } = await supabase
        .from("site_visits")
        .insert(visitsToInsert)
        .select();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
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
});
