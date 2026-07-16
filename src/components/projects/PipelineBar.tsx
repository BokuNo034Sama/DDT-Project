"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { UserPill } from "@/components/ui/UserPill";
import { Button } from "@/components/ui/button";
import { StageAssignModal } from "./StageAssignModal";
import { ProofReviewModal } from "./ProofReviewModal";
import { formatDuration } from "@/lib/efficiency";
import Link from "next/link";
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
  Sparkles,
  Download,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useToast } from "@/hooks/use-toast";

import { ProjectWithRelations } from "@/types";
import { STATUS_ORDER } from "@/lib/status-transitions";
import { ReportBotPanel } from "@/components/v4/ReportBotPanel";

interface PipelineBarProps {
  project: ProjectWithRelations;
  stages: any[];
  userRole: string;
  plan: "free" | "starter" | "pro";
}

// Local helper component for Proofread Bot Panel
function ProofreadBotPanel({
  projectId,
  project,
  isManager,
  setIsProofOpen,
}: {
  projectId: string;
  project: any;
  isManager: boolean;
  setIsProofOpen: (val: boolean) => void;
}) {
  const isCompleted = STATUS_ORDER.indexOf(project.status || "not_started") > STATUS_ORDER.indexOf("proof_ready");

  if (isCompleted) {
    return (
      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 justify-center mt-4">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Proofread Bot Completed</span>
      </span>
    );
  }

  if (project.status === "proof_ready") {
    return (
      <div className="mt-4">
        {isManager ? (
          <Button
            type="button"
            onClick={() => setIsProofOpen(true)}
            className="bg-ddt-lime hover:bg-ddt-lime/90 text-black font-bold text-xs py-2 w-full rounded-xl transition-all"
          >
            Send to Proofread Bot
          </Button>
        ) : (
          <span className="text-xs text-emerald-400 font-semibold block text-center">Ready for proofreading</span>
        )}
      </div>
    );
  }

  return (
    <span className="text-xs text-ddt-faint italic font-medium font-sans block text-center mt-4">
      Awaiting previous stages
    </span>
  );
}

export function PipelineBar({ project, stages, userRole, plan }: PipelineBarProps) {
  const isOnline = useNetworkStatus();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Modals visibility state
  const [assignStage, setAssignStage] = useState<"analysis" | "sketch" | "report_writing" | "proofreading" | null>(null);
  const [isProofOpen, setIsProofOpen] = useState(false);
  const [activeReassignId, setActiveReassignId] = useState<string | null>(null);

  const { data: me } = trpc.staff.getMe.useQuery();
  const role = userRole || me?.role || "staff";
  const isManager = role === "ops_manager" || role === "lab_owner" || role === "super_admin";

  const isProPlan = plan === "pro";

  // Mode states for Gated Pipeline Options
  const [reportMode, setReportMode] = useState<"staff" | "ai">(
    project.status === "report_bot_draft" ? "ai" : "staff"
  );
  const [proofMode, setProofMode] = useState<"staff" | "ai">("staff");

  // Get active staff members in the tenant for reassigning dropdown
  const { data: staffList, isLoading: loadingStaff } = trpc.staff.list.useQuery();

  const { data: draft } = trpc.reportBot.getDraftByProject.useQuery(
    { projectId: project.id },
    { enabled: !!project.id }
  );

  const reassignMutation = trpc.tasks.reassignTask.useMutation({
    onSuccess: async () => {
      toast({
        title: "Task Reassigned",
        description: "The task has been successfully reassigned.",
      });
      await utils.projects.getById.invalidate({ id: project.id });
      setActiveReassignId(null);
    },
    onError: (err) => {
      toast({
        title: "Reassignment Failed",
        description: err.message || "Failed to reassign task.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!activeReassignId) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".reassign-container")) {
        setActiveReassignId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeReassignId]);

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
    },
    {
      id: "lsmtl_upload" as const,
      label: "LSMTL Upload",
      icon: Upload,
    },
  ];

  // Helper to determine active stage
  const getStageStatus = (stageId: string, assignment: any) => {
    if (stageId === "lsmtl_upload") {
      const status = project.status;
      if (status === "report_uploaded" || status === "report_verified" || status === "report_delivered") {
        return "completed";
      }
      if (status === "proof_ready" || status === "report_done") {
        return "active";
      }
      return "pending";
    }

    if (assignment?.status === "completed") return "completed";
    if (assignment?.status === "failed") return "failed";
    if (assignment?.status === "in_progress") return "in_progress";

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
      if (status === "proof_ready") return "active";
      const orderIdx = STATUS_ORDER.indexOf(status || "not_started");
      const uploadedIdx = STATUS_ORDER.indexOf("report_uploaded");
      if (orderIdx >= uploadedIdx) return "completed";
      return "pending";
    }

    return "pending";
  };

  const getStageDisplayStatus = (stageId: string, assignment: any) => {
    const calculated = getStageStatus(stageId, assignment);
    if (assignment?.status) return assignment.status;
    if (stageId === "lsmtl_upload") return calculated;
    return calculated === "active" ? "in_progress" : "pending";
  };

  const renderStaffAssignSection = (stage: any, assignment: any) => {
    return (
      <div className="my-2">
        {assignment?.assigned_to || assignment?.assigned_user?.full_name ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <UserPill
                name={assignment.assigned_user?.full_name || "Assigned Technician"}
                avatarInitials={(assignment.assigned_user?.full_name || "Assigned Technician")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .substring(0, 2)}
              />
            </div>

            {isManager && (
              <div className="flex flex-col gap-2 mt-1.5 pt-2 border-t border-ddt-border/20 relative reassign-container">
                {/* Reassign dropdown triggering */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveReassignId(activeReassignId === assignment.id ? null : assignment.id)}
                    disabled={!isOnline || reassignMutation.isPending}
                    className={cn(
                      "w-full flex items-center justify-center space-x-2 py-2 px-4 border border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-800/60 rounded-xl text-xs font-medium text-slate-300 transition-all group",
                      (!isOnline || reassignMutation.isPending) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {reassignMutation.isPending && activeReassignId === assignment.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                    )}
                    <span>Reassign Staff</span>
                  </button>

                  {activeReassignId === assignment.id && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-ddt-surface border border-ddt-border rounded-lg shadow-xl p-1 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                      {loadingStaff ? (
                        <div className="flex items-center gap-2 p-2 text-xs text-ddt-muted justify-center">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-ddt-accent" />
                          <span>Loading staff...</span>
                        </div>
                      ) : (
                        staffList
                          ?.filter((member: any) => member.is_active !== false && member.id !== assignment.assigned_to)
                          .map((member: any) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => {
                                reassignMutation.mutate({
                                  taskId: assignment.id,
                                  newStaffId: member.id,
                                });
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-xs text-ddt-text hover:bg-ddt-accent hover:text-black rounded-md transition-colors duration-150"
                            >
                              {member.full_name}
                            </button>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {isManager ? (
              <Button
                type="button"
                onClick={() => isOnline && setAssignStage(stage.id)}
                disabled={!isOnline}
                className={cn(
                  "border border-dashed border-ddt-border text-ddt-muted transition-all duration-200 text-xs w-full py-2 flex items-center justify-center gap-1.5 h-auto rounded-lg",
                  isOnline
                    ? "bg-transparent hover:bg-ddt-accent/5 hover:border-ddt-accent hover:text-ddt-accent"
                    : "cursor-not-allowed opacity-50 bg-ddt-input"
                )}
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
    );
  };

  // Proof reviews & faults calculations
  const proofReviews = project.proof_reviews || [];
  const failedReviews = proofReviews.filter((r) => r.result === "fail");
  const faultCount = failedReviews.length;

  return (
    <div className="space-y-6">
      {/* Horizontal Pipeline Bar Container */}
      <div
        className="shadow-md relative overflow-hidden"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
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
        </div>

        {/* 5-Stage Horizontal/Vertical Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative font-sans">
          {stagesConfig.map((stage, index) => {
            const assignment = project.project_stage_assignments?.find((a) => a.stage === stage.id);
            const displayStatus = getStageDisplayStatus(stage.id, assignment);
            const isCompleted = displayStatus === "completed";
            const isFailed = displayStatus === "failed";
            const isInProgress = displayStatus === "in_progress";

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

            if (stage.id === "lsmtl_upload") {
              const status = project.status;
              if (status === "report_uploaded" || status === "report_verified" || status === "report_delivered") {
                borderClass = "border-emerald-500/40 bg-emerald-950/5";
                statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
                statusLabel = "Report Uploaded";
              } else if (status === "proof_ready" || status === "report_done") {
                borderClass = "border-ddt-accent/60 bg-ddt-accent/5";
                glowClass = "shadow-lg shadow-ddt-accent/5 ring-1 ring-ddt-accent/30";
                statusIcon = <Clock className="w-4 h-4 text-ddt-accent" />;
                statusLabel = "Awaiting Upload";
              } else {
                borderClass = "border-ddt-border";
                statusIcon = <Clock className="w-4 h-4 text-ddt-faint" />;
                statusLabel = "Awaiting previous stages";
              }
            }

            return (
              <div
                key={stage.id}
                className={cn(
                  "border rounded-xl p-4 flex flex-col justify-between min-h-[160px] relative transition-all duration-300",
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
                </div>

                {/* Content Section */}
                <div className="my-4 flex-1 flex flex-col justify-center">
                  {stage.id === "report_writing" ? (
                    isProPlan ? (
                      <div className="space-y-3">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-ddt-muted">
                          Report Writing Mode
                        </p>
                        <div className="flex p-1 bg-ddt-input rounded-xl border border-ddt-border/50 gap-1">
                          <button
                            type="button"
                            onClick={() => setReportMode("staff")}
                            className={cn(
                              "flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all duration-200",
                              reportMode === "staff"
                                ? "bg-ddt-accent text-black shadow-md"
                                : "text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised/50"
                            )}
                          >
                            👤 Staff
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportMode("ai")}
                            className={cn(
                              "flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all duration-200",
                              reportMode === "ai"
                                ? "bg-ddt-accent text-black shadow-md"
                                : "text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised/50"
                            )}
                          >
                            🤖 Report Bot
                          </button>
                        </div>

                        {reportMode === "staff" ? (
                          renderStaffAssignSection(stage, assignment)
                        ) : (
                          <div className="mt-2">
                            <ReportBotPanel project={project} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {renderStaffAssignSection(stage, assignment)}
                        <div 
                          className="mt-3 flex flex-col gap-1.5 text-[11px]"
                          style={{
                            background: "rgba(163, 230, 53, 0.06)",
                            border: "1px solid rgba(163, 230, 53, 0.2)",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        >
                          <span className="text-ddt-muted leading-snug">
                            ✨ Pro plan includes Report Bot AI to generate draft reports automatically.
                          </span>
                          <Link
                            href="/settings?tab=billing"
                            className="text-xs font-bold hover:underline"
                            style={{ color: "#A3E635" }}
                          >
                            Upgrade to Pro →
                          </Link>
                        </div>
                      </div>
                    )
                  ) : stage.id === "proofreading" ? (
                    isProPlan ? (
                      <div className="space-y-3">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-ddt-muted">
                          Proofreading Mode
                        </p>
                        <div className="flex p-1 bg-ddt-input rounded-xl border border-ddt-border/50 gap-1">
                          <button
                            type="button"
                            onClick={() => setProofMode("staff")}
                            className={cn(
                              "flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all duration-200",
                              proofMode === "staff"
                                ? "bg-ddt-accent text-black shadow-md"
                                : "text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised/50"
                            )}
                          >
                            👤 Staff
                          </button>
                          <button
                            type="button"
                            onClick={() => setProofMode("ai")}
                            className={cn(
                              "flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all duration-200",
                              proofMode === "ai"
                                ? "bg-ddt-accent text-black shadow-md"
                                : "text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised/50"
                            )}
                          >
                            🤖 Proofread Bot
                          </button>
                        </div>

                        {proofMode === "staff" ? (
                          renderStaffAssignSection(stage, assignment)
                        ) : (
                          <div className="mt-2">
                            <ProofreadBotPanel
                              projectId={project.id}
                              project={project}
                              isManager={isManager}
                              setIsProofOpen={setIsProofOpen}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {renderStaffAssignSection(stage, assignment)}
                        <div 
                          className="mt-3 flex flex-col gap-1.5 text-[11px]"
                          style={{
                            background: "rgba(163, 230, 53, 0.06)",
                            border: "1px solid rgba(163, 230, 53, 0.2)",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        >
                          <span className="text-ddt-muted leading-snug">
                            ✨ Pro plan includes Proofread Bot AI to check reports against LSMTL guidelines.
                          </span>
                          <Link
                            href="/settings?tab=billing"
                            className="text-xs font-bold hover:underline"
                            style={{ color: "#A3E635" }}
                          >
                            Upgrade to Pro →
                          </Link>
                        </div>
                      </div>
                    )
                  ) : stage.id === "lsmtl_upload" ? (
                    <div className="my-4 flex-1 flex flex-col justify-center text-center">
                      {project.status === "report_uploaded" || project.status === "report_verified" || project.status === "report_delivered" ? (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Report Uploaded Successfully</span>
                        </span>
                      ) : project.status === "proof_ready" || project.status === "report_done" ? (
                        <div className="text-center space-y-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/50 text-amber-400 border border-amber-500/30">
                            Awaiting Upload
                          </span>
                          <p className="text-[11px] text-ddt-muted max-w-[180px] mx-auto leading-normal">
                            Awaiting manager to upload the finalized proofread report to LSMTL.
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-ddt-faint italic font-medium font-sans text-center block">
                          Awaiting previous stages
                        </span>
                      )}
                    </div>
                  ) : (
                    renderStaffAssignSection(stage, assignment)
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
        <div
          className="shadow-md"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
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
          currentAssigneeId={
            project.project_stage_assignments?.find((a) => a.stage === assignStage)?.assigned_to
          }
        />
      )}

      {/* Proof Review Modal */}
      <ProofReviewModal
        isOpen={isProofOpen}
        onOpenChange={setIsProofOpen}
        projectId={project.id}
        projectCode={project.ndt_code || ""}
        clientName={project.client_name || ""}
      />
    </div>
  );
}
