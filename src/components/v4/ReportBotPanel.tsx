"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RebarForm } from "./RebarForm";
import { ExcelUploadPanel } from "./ExcelUploadPanel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc/client";

interface ReportBotPanelProps {
  project: { id: string; ndt_code: string; client_name: string; status: string };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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

export function ReportBotPanel({ project, isOpen, onOpenChange }: ReportBotPanelProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [step, setStep] = useState<"grade_step" | "rebar_form" | "upload_excel" | "generating" | "complete">("grade_step");
  const [concreteGrade, setConcreteGrade] = useState("25");
  const [drawingProvided, setDrawingProvided] = useState(false);
  const [rebarData, setRebarData] = useState<any>(null);

  // Progress states
  const [currentMessageIdx, setCurrentMessageIdx] = useState(0);
  const [draftResult, setDraftResult] = useState<{ draftId: string; filename: string; downloadUrl: string } | null>(null);

  // Query latest draft if project is already in report_bot_draft status
  const { data: draft } = trpc.reportBot.getDraftByProject.useQuery(
    { projectId: project.id },
    { enabled: !!project.id && isOpen }
  );

  // Sync draft completed state when modal opens or when draft query loads
  useEffect(() => {
    if (project.status === "report_bot_draft" && draft) {
      setDraftResult({
        draftId: draft.id,
        filename: draft.draft_filename || `SKAAP_NDT_${project.ndt_code}_Draft.docx`,
        downloadUrl: "",
      });
      setStep("complete");
    } else if (isOpen && project.status !== "report_bot_draft") {
      setStep("grade_step");
    }
  }, [project.status, draft, project.ndt_code, isOpen]);

  // Cycling messages timer during generation
  useEffect(() => {
    if (step !== "generating") return;
    const interval = setInterval(() => {
      setCurrentMessageIdx((prev) => (prev + 1) % CYCLING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [step]);

  const handleGradeNext = () => {
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
      formData.append("concreteGrade", drawingProvided ? concreteGrade : "25");
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-ddt-raised border border-ddt-border text-ddt-text max-w-4xl w-[95%] sm:w-full rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-1.5 border-b border-ddt-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ddt-accent" />
            <DialogTitle className="font-syne text-lg font-bold text-ddt-accent uppercase tracking-wide">
              Report Bot — AI NDT Structural Integrity Generator
            </DialogTitle>
          </div>
          <DialogDescription className="text-ddt-muted text-xs">
            Generate a complete Word report (.docx) for project <span className="font-semibold text-ddt-text">{project.ndt_code}</span> ({project.client_name}).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Concrete Grade & Drawing Check */}
          {step === "grade_step" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="font-syne font-bold text-base text-ddt-text">
                  Step 1 of 3: Drawing & Concrete Design Grade
                </h3>
                <p className="text-xs text-ddt-muted">
                  Confirm structural drawing availability and concrete design grade for narrative calculations.
                </p>
              </div>

              {/* Question 1: Drawings */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-ddt-text">
                  Were structural drawings provided for this project?
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDrawingProvided(true)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                      drawingProvided
                        ? "bg-ddt-accent/10 border-ddt-accent text-ddt-accent font-bold shadow-sm"
                        : "bg-ddt-input border-ddt-border text-ddt-muted hover:border-ddt-border-strong hover:text-ddt-text"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawingProvided(false);
                      setConcreteGrade("25");
                    }}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                      !drawingProvided
                        ? "bg-ddt-accent/10 border-ddt-accent text-ddt-accent font-bold shadow-sm"
                        : "bg-ddt-input border-ddt-border text-ddt-muted hover:border-ddt-border-strong hover:text-ddt-text"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Question 2: Grade */}
              {drawingProvided ? (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <Label htmlFor="modal-concrete-grade" className="text-sm font-semibold text-ddt-text">
                    What is the concrete design grade?
                  </Label>
                  <Input
                    id="modal-concrete-grade"
                    type="number"
                    value={concreteGrade}
                    onChange={(e) => setConcreteGrade(e.target.value)}
                    placeholder="e.g. 25, 30, 35"
                    min="1"
                    className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-1 focus:ring-ddt-accent rounded-xl"
                  />
                  <span className="text-[10px] text-ddt-muted block">
                    Design compressive strength in N/mm²
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-ddt-surface border border-ddt-border rounded-xl text-xs text-ddt-muted leading-relaxed animate-in fade-in duration-200">
                  <p className="font-semibold text-ddt-text mb-1">Standard Assumed Strength</p>
                  An assumed design strength of <span className="font-bold text-ddt-accent">25N/mm²</span> will be used for the report narrative and analysis calculations.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ddt-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-ddt-muted hover:text-ddt-text font-medium text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleGradeNext}
                  disabled={drawingProvided && !concreteGrade.trim()}
                  className="bg-ddt-lime hover:bg-ddt-lime/90 text-black font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Next: Rebar Details</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Rebar Form */}
          {step === "rebar_form" && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-4">
                <span className="text-xs font-semibold text-ddt-accent uppercase tracking-wider">Step 2 of 3</span>
              </div>
              <RebarForm
                projectId={project.id}
                onBack={() => setStep("grade_step")}
                onNext={handleRebarNext}
              />
            </div>
          )}

          {/* Step 3: Excel Upload */}
          {step === "upload_excel" && (
            <div className="animate-in fade-in duration-300 space-y-4">
              <div className="mb-2">
                <span className="text-xs font-semibold text-ddt-accent uppercase tracking-wider">Step 3 of 3</span>
              </div>
              <ExcelUploadPanel
                onBack={() => setStep("rebar_form")}
                onGenerate={handleGenerate}
                isGenerating={false}
              />
            </div>
          )}

          {/* Step 4: Generating */}
          {step === "generating" && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-pulse">
              <Loader2 className="w-12 h-12 text-ddt-lime animate-spin" />
              <div className="space-y-2 text-center">
                <p className="font-syne font-bold text-base text-ddt-text">Report Bot is compiling your report...</p>
                <p className="text-xs text-ddt-muted font-sans italic">{CYCLING_MESSAGES[currentMessageIdx]}</p>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === "complete" && draftResult && (
            <div className="space-y-6 animate-in zoom-in duration-300 py-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-5 bg-ddt-surface border border-ddt-border rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-emerald-950/50 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="space-y-1 text-left">
                    <h3 className="font-syne font-bold text-base text-ddt-text">Draft Ready!</h3>
                    <p className="text-xs text-ddt-muted font-mono">{draftResult.filename}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                      Project status updated to: report_bot_draft
                    </p>
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

              {/* Action Information Box */}
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

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-ddt-border hover:bg-ddt-surface text-ddt-text font-semibold text-xs px-5 py-2 rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
