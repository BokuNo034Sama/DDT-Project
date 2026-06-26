import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const reportBotRouter = router({
  // Get latest draft for a project
  getDraftByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;
      const { data: draft, error } = await supabase
        .from("report_drafts")
        .select("*")
        .eq("project_id", input.projectId)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return draft || null;
    }),

  // Update status of a report draft
  updateDraftStatus: protectedProcedure
    .input(
      z.object({
        draftId: z.string().uuid(),
        status: z.enum([
          "generating",
          "draft_ready",
          "staff_editing",
          "ready_for_proofread",
          "sent_to_proofread"
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;

      // Verify draft belongs to this tenant
      const { data: draft, error: fetchError } = await supabase
        .from("report_drafts")
        .select("tenant_id")
        .eq("id", input.draftId)
        .single();

      if (fetchError || !draft) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Draft report not found" });
      }

      if (draft.tenant_id !== tenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const { data: updated, error: updateError } = await supabase
        .from("report_drafts")
        .update({
          status: input.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.draftId)
        .select()
        .single();

      if (updateError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: updateError.message });
      }

      return updated;
    }),

  // Get a signed URL to download a draft report
  getDraftDownloadUrl: protectedProcedure
    .input(z.object({ draftId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;

      // Verify draft belongs to tenant
      const { data: draft, error: fetchError } = await supabase
        .from("report_drafts")
        .select("tenant_id, storage_path")
        .eq("id", input.draftId)
        .single();

      if (fetchError || !draft) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Draft report not found" });
      }

      if (draft.tenant_id !== tenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      if (!draft.storage_path) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Draft has no storage path" });
      }

      const adminClient = createAdminClient();
      const { data: signedData, error: signedError } = await adminClient.storage
        .from("report-drafts")
        .createSignedUrl(draft.storage_path, 60 * 60); // 1 hour

      if (signedError || !signedData?.signedUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: signedError?.message || "Could not generate download URL",
        });
      }

      return { downloadUrl: signedData.signedUrl };
    }),
});
