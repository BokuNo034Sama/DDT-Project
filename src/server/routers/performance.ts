import { z } from "zod";
import { router, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { calculateEfficiencyScore } from "../utils/efficiency";

export const performanceRouter = router({
  // Aggregated stats for month + staff
  monthly: managerProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number().min(2000),
        staffId: z.string().uuid().optional(), // if undefined, get all staff
      })
    )
    .query(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;

      // Ensure start and end dates cover the requested month
      const startDate = new Date(input.year, input.month - 1, 1).toISOString();
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59).toISOString();

      // Get users
      let usersQuery = supabase
        .from("users")
        .select("id, full_name, role")
        .eq("tenant_id", tenantId)
        .in("role", ["staff", "ops_manager"]);

      if (input.staffId) {
        usersQuery = usersQuery.eq("id", input.staffId);
      }

      const { data: usersData, error: usersError } = await usersQuery;

      if (usersError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: usersError.message });
      }

      type UserType = { id: string; full_name: string; role: string };
      const users: UserType[] = usersData || [];

      // Fetch all relevant data for the period
      const [assignmentsData, siteVisitsData, faultsData] = await Promise.all([
        // Completed stage assignments
        supabase
          .from("project_stage_assignments")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("status", "completed")
          .gte("completed_at", startDate)
          .lte("completed_at", endDate),
        // Site visits
        supabase
          .from("site_visits")
          .select("*")
          .eq("tenant_id", tenantId)
          .gte("visit_date", startDate)
          .lte("visit_date", endDate),
        // Proofread faults (where result = fail)
        supabase
          .from("proof_reviews")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("result", "fail")
          .gte("reviewed_at", startDate)
          .lte("reviewed_at", endDate)
      ]);

      if (assignmentsData.error || siteVisitsData.error || faultsData.error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch performance data" });
      }

      type AssignmentType = { assigned_to: string | null; started_at: string | null; completed_at: string | null; };
      type SiteVisitType = { staff_id: string; };
      type FaultType = { report_handler_id: string | null; };

      const assignments: AssignmentType[] = assignmentsData.data || [];
      const siteVisits: SiteVisitType[] = siteVisitsData.data || [];
      const faults: FaultType[] = faultsData.data || [];

      // Calculate efficiency for each user
      const reports = users.map((user) => {
        const userAssignments = assignments.filter((a) => a.assigned_to === user.id);
        const userVisits = siteVisits.filter((sv) => sv.staff_id === user.id);
        const userFaults = faults.filter((f) => f.report_handler_id === user.id);

        const stagesCompleted = userAssignments.length;
        const siteVisitsCount = userVisits.length;
        const faultCount = userFaults.length;

        // Calculate average completion hours
        let totalHours = 0;
        let validAssignments = 0;

        userAssignments.forEach((assignment) => {
          if (assignment.started_at && assignment.completed_at) {
            const start = new Date(assignment.started_at).getTime();
            const end = new Date(assignment.completed_at).getTime();
            const hours = (end - start) / (1000 * 60 * 60);
            if (hours > 0) {
              totalHours += hours;
              validAssignments++;
            }
          }
        });

        const avgCompletionHours = validAssignments > 0 ? totalHours / validAssignments : 0;

        const efficiencyScore = calculateEfficiencyScore(
          stagesCompleted,
          avgCompletionHours,
          faultCount,
          siteVisitsCount
        );

        return {
          user,
          stats: {
            stagesCompleted,
            avgCompletionHours,
            faultCount,
            siteVisitsCount,
            efficiencyScore,
          },
        };
      });

      return reports;
    }),

  // Export PDF - Stub for now
  exportPdf: managerProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number().min(2000),
        staffId: z.string().uuid().optional(),
      })
    )
    .mutation(async () => {
      // PDF generation with @react-pdf/renderer is complex and runs server side.
      // This is a placeholder for phase 5 or 6 (reporting phase).
      return { url: "https://example.com/placeholder-report.pdf" };
    }),
});
