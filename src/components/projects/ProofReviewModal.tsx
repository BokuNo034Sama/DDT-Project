"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc/client";
import { Check, X, AlertTriangle, Loader2 } from "lucide-react";

interface ProofReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function ProofReviewModal({
  isOpen,
  onOpenChange,
  projectId,
  onSuccess,
}: ProofReviewModalProps) {
  const { toast } = useToast();
  const [result, setResult] = useState<"pass" | "fail" | null>(null);
  const [failureReason, setFailureReason] = useState("");

  const utils = trpc.useUtils();
  const reviewMutation = trpc.proofReview.submit.useMutation({
    onSuccess: (data) => {
      toast({
        title: result === "pass" ? "Proofread Passed" : "Proofread Failed",
        description:
          result === "pass"
            ? "Project status advanced to completed (report uploaded)."
            : "Project returned to Work in Progress (WIP).",
      });
      utils.projects.getById.invalidate({ id: projectId });
      onOpenChange(false);
      // Reset form states
      setResult(null);
      setFailureReason("");
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Review Submission Failed",
        description: error.message || "An error occurred while submitting the review.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) {
      toast({
        title: "Please choose a result",
        description: "Select whether the report passes or fails proofreading.",
        variant: "destructive",
      });
      return;
    }

    if (result === "fail" && !failureReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please specify why the proofread failed so the report writer can fix it.",
        variant: "destructive",
      });
      return;
    }

    reviewMutation.mutate({
      projectId,
      result,
      failureReason: result === "fail" ? failureReason : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-ddt-surface border border-ddt-border text-ddt-text max-w-md w-[95%] sm:w-full rounded-xl">
        <DialogHeader className="text-left">
          <DialogTitle className="font-syne text-lg font-bold text-ddt-accent uppercase tracking-wide">
            Submit Proofread Outcome
          </DialogTitle>
          <DialogDescription className="text-ddt-muted text-xs">
            Review the drafted report. Passing it uploads the report as final. Failing it logs a fault and returns the project to WIP.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Decision Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setResult("pass")}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 gap-2 ${
                result === "pass"
                  ? "bg-emerald-950/30 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10"
                  : "bg-ddt-input border-ddt-border text-ddt-muted hover:border-ddt-border-strong hover:text-ddt-text"
              }`}
            >
              <div className={`p-2 rounded-full ${result === "pass" ? "bg-emerald-500 text-black font-bold" : "bg-secondary text-ddt-muted"}`}>
                <Check className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm tracking-wide uppercase font-syne">Pass Report</span>
            </button>

            <button
              type="button"
              onClick={() => setResult("fail")}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 gap-2 ${
                result === "fail"
                  ? "bg-red-950/30 border-red-500 text-red-400 shadow-md shadow-red-500/10"
                  : "bg-ddt-input border-ddt-border text-ddt-muted hover:border-ddt-border-strong hover:text-ddt-text"
              }`}
            >
              <div className={`p-2 rounded-full ${result === "fail" ? "bg-red-500 text-black font-bold" : "bg-secondary text-ddt-muted"}`}>
                <X className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm tracking-wide uppercase font-syne">Fail / Revise</span>
            </button>
          </div>

          {/* Conditional failure reason */}
          {result === "fail" && (
            <div className="space-y-2 animate-in slide-in-from-top duration-200">
              <Label
                htmlFor="reason"
                className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Specify Revision Notes (Required) *</span>
              </Label>
              <textarea
                id="reason"
                rows={3}
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                placeholder="Describe the issues, e.g., missing sketch layout, incorrect floor measurements, typos in client address..."
                className="w-full bg-ddt-input border border-ddt-border focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-md py-2.5 px-3 text-sm text-ddt-text placeholder:text-ddt-faint focus:outline-none resize-none leading-relaxed"
                required
              />
            </div>
          )}

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised order-2 sm:order-1"
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`font-semibold order-1 sm:order-2 ${
                result === "pass"
                  ? "bg-emerald-500 hover:bg-emerald-600 text-black"
                  : result === "fail"
                  ? "bg-red-500 hover:bg-red-600 text-black"
                  : "bg-ddt-accent hover:bg-ddt-accent/90 text-black"
              }`}
              disabled={reviewMutation.isPending || !result}
            >
              {reviewMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </span>
              ) : (
                <span>Submit Outcome</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
