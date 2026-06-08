import { z } from "zod";
import { router, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { calculateEfficiencyScore } from "../utils/efficiency";
import { createAdminClient } from "@/lib/supabase/admin";

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
      const adminClient = createAdminClient();

      // Resolve the database-level tenant configuration directly from users profile
      const profile = await adminClient
        .from("users")
        .select("tenant_id")
        .eq("id", ctx.userId)
        .single();

      const activeTenantId = profile.data?.tenant_id || ctx.tenantId;

      // Ensure start and end dates cover the requested month
      const startDate = new Date(input.year, input.month - 1, 1).toISOString();
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59).toISOString();

      // Get users via adminClient
      let usersQuery = adminClient
        .from("users")
        .select("id, full_name, role")
        .eq("tenant_id", activeTenantId)
        .eq("is_active", true)
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

      // Fetch all relevant data for the period using adminClient
      const [assignmentsData, siteVisitsData, faultsData] = await Promise.all([
        // Completed stage assignments
        adminClient
          .from("project_stage_assignments")
          .select("*, projects(ndt_code)")
          .eq("tenant_id", activeTenantId)
          .eq("status", "completed")
          .gte("completed_at", startDate)
          .lte("completed_at", endDate),
        // Site visits
        adminClient
          .from("site_visits")
          .select("*, projects(ndt_code, client_name, number_of_floors)")
          .eq("tenant_id", activeTenantId)
          .gte("visit_date", startDate)
          .lte("visit_date", endDate),
        // Proofread faults (where result = fail)
        adminClient
          .from("proof_reviews")
          .select("*, projects(ndt_code)")
          .eq("tenant_id", activeTenantId)
          .eq("result", "fail")
          .gte("reviewed_at", startDate)
          .lte("reviewed_at", endDate)
      ]);

      if (assignmentsData.error || siteVisitsData.error || faultsData.error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch performance data" });
      }

      const assignments = (assignmentsData.data || []) as any[];
      const siteVisits = (siteVisitsData.data || []) as any[];
      const faults = (faultsData.data || []) as any[];

      // Calculate efficiency for each user
      const reports = users.map((user: UserType) => {
        const userAssignments = assignments.filter((a) => a.assigned_to === user.id);
        const userVisits = siteVisits.filter((sv) => sv.staff_id === user.id);
        const userFaults = faults.filter((f) => f.report_handler_id === user.id);

        const stagesCompleted = userAssignments.length;
        const siteVisitsCount = userVisits.length;
        const faultCount = userFaults.length;

        // Breakdown by stage type
        const stagesBreakdown = {
          analysis: userAssignments.filter((a) => a.stage === "analysis").length,
          sketch: userAssignments.filter((a) => a.stage === "sketch").length,
          report_writing: userAssignments.filter((a) => a.stage === "report_writing").length,
          proofreading: userAssignments.filter((a) => a.stage === "proofreading").length,
        };

        // Calculate average completion hours and details
        let totalHours = 0;
        let validAssignments = 0;

        const stageDetails = userAssignments.map((assignment) => {
          let durationHours = 0;
          if (assignment.started_at && assignment.completed_at) {
            const start = new Date(assignment.started_at).getTime();
            const end = new Date(assignment.completed_at).getTime();
            const hours = (end - start) / (1000 * 60 * 60);
            if (hours > 0) {
              durationHours = hours;
              totalHours += hours;
              validAssignments++;
            }
          }
          return {
            id: assignment.id,
            project_id: assignment.project_id,
            ndt_code: assignment.projects?.ndt_code ?? "—",
            stage: assignment.stage,
            started_at: assignment.started_at,
            completed_at: assignment.completed_at,
            durationHours,
          };
        });

        const avgCompletionHours = validAssignments > 0 ? totalHours / validAssignments : 0;

        const efficiencyScore = calculateEfficiencyScore(
          stagesCompleted,
          avgCompletionHours,
          faultCount,
          siteVisitsCount
        );

        const siteVisitDetails = userVisits.map((sv) => ({
          id: sv.id,
          project_id: sv.project_id,
          ndt_code: sv.projects?.ndt_code ?? "—",
          client_name: sv.projects?.client_name ?? "—",
          visit_date: sv.visit_date,
          number_of_floors: sv.number_of_floors ?? sv.projects?.number_of_floors ?? null,
        }));

        const faultDetails = userFaults.map((f) => ({
          id: f.id,
          project_id: f.project_id,
          ndt_code: f.projects?.ndt_code ?? "—",
          failure_reason: f.failure_reason,
          reviewed_at: f.reviewed_at,
        }));

        return {
          user,
          stats: {
            stagesCompleted,
            stagesBreakdown,
            avgCompletionHours,
            faultCount,
            siteVisitsCount,
            efficiencyScore,
          },
          stageDetails,
          siteVisitDetails,
          faultDetails,
        };
      });

      return reports;
    }),



  // Get all months with activity for the dropdown
  getAllMonths: managerProcedure.query(async ({ ctx }) => {
    // Return a dummy list or ideally fetch from db: SELECT DISTINCT DATE_TRUNC('month', created_at) ...
    // For now, let's return the last 6 months for the UI
    const months = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
        value: { month: d.getMonth() + 1, year: d.getFullYear() }
      });
    }
    return months;
  }),
});
