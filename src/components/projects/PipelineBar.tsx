"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { UserPill } from "@/components/ui/UserPill";
import { Button } from "@/components/ui/button";
import { StageAssignModal } from "./StageAssignModal";
import { ProofReviewModal } from "./ProofReviewModal";
import { formatDuration } from "@/lib/efficiency";
import {
  Activity,
  Brush,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserPlus,
  Shield,
  PlusCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { ProjectWithRelations } from "@/types";

interface PipelineBarProps {
  project: ProjectWithRelations;
}

export function PipelineBar({ project }: PipelineBarProps) {
  // Modals visibility state
  const [assignStage, setAssignStage] = useState<"analysis" | "sketch" | "report_writing" | "proofreading" | null>(null);
  const [isProofOpen, setIsProofOpen] = useState(false);

  const { data: me } = trpc.staff.getMe.useQuery();
  const role = me?.role;

  const isManager = role === "ops_manager" || role === "lab_owner" || role === "super_admin";

  // Stages configuration
  const stagesConfig = [
    {
      id: "analysis" as const,
      label: "Analysis",
      icon: Activity,
    },
    {
      id: "sketch" as const,
      label: "Sketch",
      icon: Brush,
    },
    {
      id: "report_writing" as const,
      label: "Report Writing",
      icon: FileText,
    },
    {
      id: "proofreading" as const,
      label: "Proofreading",
      icon: FileCheck,
      managerOnly: true,
    },
  ];

  // Helper to determine active stage
  const getStageStatus = (stageId: string, assignment: any) => {
    if (assignment?.status === "completed") return "completed";
    if (assignment?.status === "failed") return "failed";
    if (assignment?.status === "in_progress") return "in_progress";
    
    // Auto-compute active/next stage in the pipeline if status not set explicitly
    const status = project.status;
    if (stageId === "analysis") {
      if (status === "not_started") return "pending";
      if (status === "wip" && !assignment) return "active";
      return "pending";
    }
    if (stageId === "sketch") {
      if (status === "analysis_done") return "active";
      return "pending";
    }
    if (stageId === "report_writing") {
      if (status === "sketch_done") return "active";
      return "pending";
    }
    if (stageId === "proofreading") {
      if (status === "report_done" || status === "proof_ready") return "active";
      return "pending";
    }
    
    return "pending";
  };

  const getStageDisplayStatus = (stageId: string, assignment: any) => {
    const calculated = getStageStatus(stageId, assignment);
    if (assignment?.status) return assignment.status;
    return calculated === "active" ? "in_progress" : "pending";
  };

  // Proof reviews & faults calculations
  const proofReviews = project.proof_reviews || [];
  const failedReviews = proofReviews.filter((r) => r.result === "fail");
  const faultCount = failedReviews.length;

  return (
    <div className="space-y-6">
      {/* Horizontal Pipeline Bar Container */}
      <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md p-6 relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-ddt-muted">
              Project Pipeline
            </h2>
            {faultCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950/30 text-red-400 border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{faultCount} {faultCount === 1 ? "Fault" : "Faults"}</span>
              </span>
            )}
          </div>
          {(project.status === "report_done" || project.status === "proof_ready") && isManager && (
            <Button
              onClick={() => setIsProofOpen(true)}
              className="bg-ddt-lime hover:bg-ddt-lime/90 text-black font-semibold text-xs py-1.5 px-3 rounded shadow-sm shadow-ddt-lime/10 transition-all duration-200"
            >
              Submit Proofread
            </Button>
          )}
        </div>

        {/* 4-Stage Horizontal/Vertical Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
          {stagesConfig.map((stage, index) => {
            const assignment = project.project_stage_assignments?.find((a) => a.stage === stage.id);
            const displayStatus = getStageDisplayStatus(stage.id, assignment);
            const isCompleted = displayStatus === "completed";
            const isFailed = displayStatus === "failed";
            const isInProgress = displayStatus === "in_progress";
            const isPending = displayStatus === "pending";

            // Colors mapping
            let borderClass = "border-ddt-border";
            let glowClass = "";
            let statusIcon = <Clock className="w-4 h-4 text-ddt-faint" />;
            let statusLabel = "Awaiting Start";

            if (isCompleted) {
              borderClass = "border-emerald-500/40 bg-emerald-950/5";
              statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
              statusLabel = "Completed";
            } else if (isFailed) {
              borderClass = "border-red-500/40 bg-red-950/5";
              statusIcon = <AlertCircle className="w-4 h-4 text-red-400" />;
              statusLabel = "Revision Needed";
            } else if (isInProgress) {
              borderClass = "border-ddt-accent/60 bg-ddt-accent/5";
              glowClass = "shadow-lg shadow-ddt-accent/5 ring-1 ring-ddt-accent/30";
              statusIcon = <Loader2 className="w-4 h-4 text-ddt-accent animate-spin" />;
              statusLabel = "In Progress";
            }

            return (
              <div
                key={stage.id}
                className={cn(
                  "border rounded-xl p-4 flex flex-col justify-between min-h-[140px] relative transition-all duration-300",
                  borderClass,
                  glowClass
                )}
              >
                {/* Stage Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "p-1.5 rounded-lg border",
                      isCompleted ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-400" :
                      isFailed ? "bg-red-950/50 border-red-500/30 text-red-400" :
                      isInProgress ? "bg-ddt-accent-bg border-ddt-accent/30 text-ddt-accent" :
                      "bg-ddt-raised border-ddt-border text-ddt-muted"
                    )}>
                      <stage.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-ddt-muted uppercase tracking-wider block">
                        Stage {index + 1}
                      </span>
                      <span className="font-syne font-bold text-ddt-text text-sm">
                        {stage.label}
                      </span>
                    </div>
                  </div>

                  {stage.managerOnly && !isManager && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ddt-raised text-[10px] text-ddt-muted border border-ddt-border font-medium">
                      <Shield className="w-3 h-3 text-ddt-accent" />
                      <span>Mgr Only</span>
                    </span>
                  )}
                </div>

                {/* Assignee Section */}
                <div className="my-4">
                  {assignment?.assigned_user ? (
                    <div className="flex items-center justify-between gap-2">
                      <UserPill
                        name={assignment.assigned_user.full_name}
                        avatarInitials={assignment.assigned_user.full_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .substring(0, 2)}
                      />
                      {isManager && (
                        <button
                          onClick={() => setAssignStage(stage.id)}
                          className="text-[10px] text-ddt-muted hover:text-ddt-accent hover:underline"
                        >
                          Reassign
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      {isManager ? (
                        <Button
                          onClick={() => setAssignStage(stage.id)}
                          className="bg-transparent hover:bg-ddt-accent/5 border border-dashed border-ddt-border hover:border-ddt-accent text-ddt-muted hover:text-ddt-accent transition-all duration-200 text-xs w-full py-2 flex items-center justify-center gap-1.5 h-auto rounded-lg"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Assign Staff</span>
                        </Button>
                      ) : (
                        <span className="text-xs text-ddt-faint italic font-medium font-sans">
                          Unassigned
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Stage Footer (Status & Timestamps) */}
                <div className="flex items-center justify-between text-[10px] text-ddt-muted pt-2 border-t border-ddt-border/30 font-mono">
                  <div className="flex items-center gap-1.5">
                    {statusIcon}
                    <span className="font-semibold">{statusLabel}</span>
                  </div>
                  {isCompleted && assignment?.started_at && assignment?.completed_at && (
                    <span className="text-ddt-accent font-semibold">
                      {formatDuration(assignment.started_at, assignment.completed_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proof Review History Audit Trail (Below Pipeline Bar) */}
      {proofReviews.length > 0 && (
        <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md p-6">
          <h3 className="text-sm font-syne font-bold uppercase tracking-wider text-ddt-muted mb-4">
            Proofread Review History
          </h3>
          <div className="space-y-4">
            {proofReviews.map((review) => {
              const isPass = review.result === "pass";
              return (
                <div
                  key={review.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border text-sm transition-all",
                    isPass
                      ? "bg-emerald-950/10 border-emerald-500/20 text-ddt-text"
                      : "bg-red-950/10 border-red-500/20 text-ddt-text"
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                          isPass
                            ? "bg-emerald-950/50 text-emerald-400 border-emerald-500/30"
                            : "bg-red-950/50 text-red-400 border-red-500/30"
                        )}
                      >
                        {review.result}
                      </span>
                      <span className="font-sans text-xs text-ddt-muted">
                        Reviewed by{" "}
                        <span className="font-semibold text-ddt-text">
                          {review.reviewer_user?.full_name || "Manager"}
                        </span>
                      </span>
                    </div>
                    {!isPass && review.failure_reason && (
                      <p className="text-xs bg-red-950/20 border border-red-500/10 text-red-300 p-2.5 rounded-md leading-relaxed">
                        <span className="font-semibold block mb-0.5">Revision Notes:</span>
                        {review.failure_reason}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-ddt-muted font-mono whitespace-nowrap shrink-0">
                    {new Date(review.reviewed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stage Assign Modal */}
      {assignStage && (
        <StageAssignModal
          isOpen={!!assignStage}
          onOpenChange={(open) => !open && setAssignStage(null)}
          projectId={project.id}
          stage={assignStage}
          currentAssignedId={
            project.project_stage_assignments?.find((a) => a.stage === assignStage)?.assigned_to
          }
        />
      )}

      {/* Proof Review Modal */}
      <ProofReviewModal
        isOpen={isProofOpen}
        onOpenChange={setIsProofOpen}
        projectId={project.id}
      />
    </div>
  );
}
