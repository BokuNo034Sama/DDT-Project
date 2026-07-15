"use client";

import { useState, useEffect } from "react";
import { ConcreteGradeModal } from "./ConcreteGradeModal";
import { RebarForm } from "./RebarForm";
import { ExcelUploadPanel } from "./ExcelUploadPanel";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc/client";

interface ReportBotPanelProps {
  project: { id: string; ndt_code: string; client_name: string; status: string };
}

const CYCLING_MESSAGES = [
  "Uploading scientific observations...",
  "Compiling site information...",
  "Writing Introduction section...",
  "Generating equipment status check...",
  "Building analysis tables...",
  "Writing Recommendation...",
  "Assembling complete report...",
];

export function ReportBotPanel({ project }: ReportBotPanelProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [step, setStep] = useState<"not_started" | "grade_modal" | "rebar_form" | "upload_excel" | "generating" | "complete">("not_started");
  const [concreteGrade, setConcreteGrade] = useState("25");
  const [drawingProvided, setDrawingProvided] = useState(false);
  const [rebarData, setRebarData] = useState<any>(null);
  
  // Progress states
  const [currentMessageIdx, setCurrentMessageIdx] = useState(0);
  const [draftResult, setDraftResult] = useState<{ draftId: string; filename: string; downloadUrl: string } | null>(null);

  // Query latest draft if project is already in report_bot_draft status
  const { data: draft } = trpc.reportBot.getDraftByProject.useQuery(
    { projectId: project.id },
    { enabled: !!project.id }
  );

  // Sync draft completed state on mount or when draft query loads
  useEffect(() => {
    if (project.status === "report_bot_draft" && draft) {
      setDraftResult({
        draftId: draft.id,
        filename: draft.draft_filename || `SKAAP_NDT_${project.ndt_code}_Draft.docx`,
        downloadUrl: "",
      });
      setStep("complete");
    }
  }, [project.status, draft, project.ndt_code]);

  // Cycling messages timer
  useEffect(() => {
    if (step !== "generating") return;
    const interval = setInterval(() => {
      setCurrentMessageIdx((prev) => (prev + 1) % CYCLING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [step]);

  const handleStart = () => {
    setStep("grade_modal");
  };

  const handleGradeNext = (provided: boolean, grade: string) => {
    setDrawingProvided(provided);
    setConcreteGrade(grade);
    setStep("rebar_form");
  };

  const handleRebarNext = (data: any) => {
    setRebarData(data);
    setStep("upload_excel");
  };

  const handleGenerate = async (excelFile: File) => {
    setStep("generating");
    setCurrentMessageIdx(0);

    try {
      const formData = new FormData();
      formData.append("projectId", project.id);
      formData.append("concreteGrade", concreteGrade);
      formData.append("drawingProvided", drawingProvided ? "true" : "false");
      formData.append("rebarData", JSON.stringify(rebarData));
      formData.append("excelFile", excelFile);

      const response = await fetch("/api/v4/generate-report", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Report generation failed");
      }

      setDraftResult({
        draftId: result.draftId,
        filename: result.filename,
        downloadUrl: result.downloadUrl,
      });

      toast({
        title: "Draft Report Generated",
        description: `Successfully compiled the draft report for ${project.ndt_code}.`,
      });

      setStep("complete");
      // Invalidate project query to refresh status in UI
      await utils.projects.getById.invalidate({ id: project.id });
      await utils.reportBot.getDraftByProject.invalidate({ projectId: project.id });
    } catch (error: any) {
      toast({
        title: "Report Generation Failed",
        description: error.message || "An unexpected error occurred during generation.",
        variant: "destructive",
      });
      setStep("upload_excel");
    }
  };

  return (
    <div className="bg-ddt-surface border-2 border-ddt-border rounded-2xl shadow-xl p-6 relative overflow-hidden animate-in fade-in duration-300">
      {/* Visual Indicator Glow */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-ddt-lime animate-pulse" />

      {step === "not_started" && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5 text-left">
            <h3 className="font-syne font-bold text-base text-ddt-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ddt-accent" />
              <span>Generate NDT Structural Integrity Report</span>
            </h3>
            <p className="text-xs text-ddt-muted max-w-xl">
              Launch SKAAP CONSULT&apos;s AI Report Bot to parse scientific observations, rebar details, and automatically draft a complete Word report (.docx) for manual Visual Inspection review.
            </p>
          </div>
          <Button
            onClick={handleStart}
            className="bg-ddt-lime hover:bg-ddt-lime/90 text-black font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition-all self-start sm:self-center whitespace-nowrap"
          >
            Generate Report Draft
          </Button>
        </div>
      )}

      {step === "grade_modal" && (
        <ConcreteGradeModal
          isOpen={true}
          onOpenChange={(open) => !open && setStep("not_started")}
          onNext={handleGradeNext}
        />
      )}

      {step === "rebar_form" && (
        <RebarForm
          projectId={project.id}
          onBack={() => setStep("grade_modal")}
          onNext={handleRebarNext}
        />
      )}

      {step === "upload_excel" && (
        <ExcelUploadPanel
          onBack={() => setStep("rebar_form")}
          onGenerate={handleGenerate}
          isGenerating={false}
        />
      )}

      {step === "generating" && (
        <div className="py-8 flex flex-col items-center justify-center space-y-4 animate-pulse">
          <Loader2 className="w-10 h-10 text-ddt-lime animate-spin" />
          <div className="space-y-1.5 text-center">
            <p className="font-syne font-bold text-sm text-ddt-text">Report Bot is writing your report...</p>
            <p className="text-xs text-ddt-muted font-sans italic">{CYCLING_MESSAGES[currentMessageIdx]}</p>
          </div>
        </div>
      )}

      {step === "complete" && draftResult && (
        <div className="space-y-6 animate-in zoom-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-emerald-950/50 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1 text-left">
                <h3 className="font-syne font-bold text-base text-ddt-text">Draft Ready!</h3>
                <p className="text-xs text-ddt-muted font-mono">{draftResult.filename}</p>
                <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Project status updated to: report_bot_draft</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`/api/v4/download-draft?draftId=${draftResult.draftId}`}
                download
                className="inline-flex items-center gap-2 bg-ddt-lime hover:bg-ddt-lime/90 text-black font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition-all whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Download Draft (.docx)
              </a>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-2 text-left">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Staff Action Required</span>
            </div>
            <p className="text-xs text-amber-300 leading-relaxed">
              Open the downloaded draft in Microsoft Word and complete the highlighted sections:
            </p>
            <ul className="text-xs text-amber-300/80 list-disc list-inside space-y-1 pl-1">
              <li>Visual Test (Section 4.2)</li>
              <li>Site location map (Page 7)</li>
              <li>Weather condition image (Page 7)</li>
              <li>Building photographs (Appendix)</li>
            </ul>
            <p className="text-xs text-amber-300/60 pt-1">
              When complete, re-upload the finalized report document to send it to the Proofread Bot.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
