import { z } from "zod";
import { router, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const proofReviewRouter = router({
  // Submit a proofread pass or fail
  submit: managerProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        result: z.enum(["pass", "fail"]),
        failureReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId, userId } = ctx;

      // Ensure project is in correct status
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("status, ndt_code")
        .eq("id", input.projectId)
        .eq("tenant_id", tenantId)
        .single();

      if (projectError || !project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      if (project.status !== "report_done" && project.status !== "proof_ready") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Project is not ready for proofreading" });
      }

      // Find the user who did the report writing
      const { data: assignment } = await supabase
        .from("project_stage_assignments")
        .select("assigned_to")
        .eq("project_id", input.projectId)
        .eq("tenant_id", tenantId)
        .eq("stage", "report_writing")
        .single();

      const reportHandlerId = assignment?.assigned_to || null;

      // Insert review record
      const { data: review, error: reviewError } = await supabase
        .from("proof_reviews")
        .insert({
          project_id: input.projectId,
          tenant_id: tenantId,
          reviewed_by: userId,
          result: input.result,
          failure_reason: input.failureReason || null,
          report_handler_id: reportHandlerId,
        })
        .select()
        .single();

      if (reviewError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: reviewError.message });
      }

      // Update project status
      const newStatus = input.result === "pass" ? "report_uploaded" : "wip";
      
      await supabase
        .from("projects")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", input.projectId);

      await supabase.from("status_history").insert({
        project_id: input.projectId,
        tenant_id: tenantId,
        from_status: project.status,
        to_status: newStatus,
        changed_by: userId,
        notes: `Proofread ${input.result}`,
      });

      // Send notification
      if (reportHandlerId) {
        await supabase.from("notifications").insert({
          tenant_id: tenantId,
          user_id: reportHandlerId,
          type: input.result === "pass" ? "proof_passed" : "proof_failed",
          title: `Proofread ${input.result.toUpperCase()}`,
          body: `The report for ${project.ndt_code} was marked as ${input.result}.${input.result === "fail" ? ` Reason: ${input.failureReason}` : ""}`,
          related_project_id: input.projectId,
        });
      }

      return review;
    }),
});
