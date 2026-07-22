"use client";

import { useState, useEffect, Fragment } from "react";
import { trpc } from "@/lib/trpc/client";
import { UserPill } from "@/components/ui/UserPill";
import { Button } from "@/components/ui/button";
import { StageAssignModal } from "./StageAssignModal";
import { ProofReviewModal } from "./ProofReviewModal";
import { formatDuration } from "@/lib/efficiency";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LsmtlTrackingCard } from "./LsmtlTrackingCard";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
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

  if (project.status === "proof_ready" || project.status === "report_done") {
    return (
      <div className="mt-4">
        <Button
          type="button"
          onClick={() => setIsProofOpen(true)}
          className="bg-ddt-lime hover:bg-ddt-lime/90 text-black font-bold text-xs py-2 w-full rounded-xl transition-all"
        >
          Send to Proofread Bot
        </Button>
      </div>
    );
  }

  return (
    <span className="text-xs text-ddt-faint italic font-medium font-sans block text-center mt-4">
      Awaiting previous stages
    </span>
  );
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const UpgradeHint = ({ stage }: { stage: string }) => {
  const description = stage === "report_writing"
    ? "Report Bot AI to generate draft reports automatically."
    : "Proofread Bot AI to check reports against LSMTL guidelines.";
  return (
    <div className="upgrade-hint">
      <span>✨ Pro plan includes {description}</span>
      <Link href="/settings?tab=billing">
        Upgrade to Pro →
      </Link>
    </div>
  );
};

export function PipelineBar({ project, stages, userRole, plan }: PipelineBarProps) {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Modals visibility state
  const [assignStage, setAssignStage] = useState<"analysis" | "sketch" | "report_writing" | "proofreading" | null>(null);
  const [isProofOpen, setIsProofOpen] = useState(false);
  const [isReportBotOpen, setIsReportBotOpen] = useState(false);
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

  const updateLsmtlStatus = trpc.projects.updateLsmtlStatus.useMutation({
    onSuccess: (data, variables) => {
      toast({
        title: variables.lsmtlStatus === "report_collected" ? "Project Completed" : "LSMTL Status Updated",
        description: variables.lsmtlStatus === "report_collected"
          ? "Project marked as delivered."
          : "The status has been successfully updated.",
      });
      if (variables.lsmtlStatus !== "report_collected") {
        utils.projects.getById.invalidate({ id: project.id });
      }
    },
    onError: (err) => {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update LSMTL status.",
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
      if (status === "proof_ready" || status === "report_done") return "active";
      const orderIdx = STATUS_ORDER.indexOf(status || "not_started");
      const uploadedIdx = STATUS_ORDER.indexOf("report_uploaded");
      if (orderIdx >= uploadedIdx) return "completed";
      return "pending";
    }

    return "pending";
  };

  const getStageDisplayStatus = (stageId: string, assignment: any) => {
    const calculated = getStageStatus(stageId, assignment);
    if (calculated === "completed") return "completed";
    if (calculated === "active") return "in_progress";
    if (assignment?.status) return assignment.status;
    if (stageId === "lsmtl_upload") return calculated;
    return calculated === "active" ? "in_progress" : "pending";
  };

  const renderStaffAssignSection = (stage: any, assignment: any) => {
    const assignedName = assignment?.assigned_user?.full_name || "Assigned Technician";
    const assignedRole = (assignment?.assigned_user?.role || "technician").replace(/_/g, " ");

    return (
      <div className="my-1.5 w-full">
        {assignment?.assigned_to || assignment?.assigned_user?.full_name ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-3 py-1 px-1 h-[48px]">
              <AvatarCircle initials={getInitials(assignedName)} className="w-8 h-8 shrink-0 bg-blue-600 text-white font-bold text-xs flex items-center justify-center rounded-full" />
              <div className="flex flex-col justify-center min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate leading-tight">
                  {assignedName}
                </p>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider leading-tight mt-0.5">
                  {assignedRole}
                </p>
              </div>
            </div>

            {isManager && (
              <div className="relative reassign-container mt-1.5">
                <button
                  type="button"
                  onClick={() => setActiveReassignId(activeReassignId === assignment.id ? null : assignment.id)}
                  disabled={!isOnline || reassignMutation.isPending}
                  className={cn(
                    "w-full py-1.5 px-3 border border-dashed border-slate-700/80 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-800/60 rounded-lg text-[11px] font-medium text-slate-300 transition-all flex items-center justify-center gap-1.5",
                    (!isOnline || reassignMutation.isPending) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {reassignMutation.isPending && activeReassignId === assignment.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Reassign Staff</span>
                </button>

                {activeReassignId === assignment.id && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                    {loadingStaff ? (
                      <div className="flex items-center gap-2 p-2 text-xs text-slate-400 justify-center">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
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
                            className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-blue-600 hover:text-white rounded-md transition-colors duration-150"
                          >
                            {member.full_name}
                          </button>
                        ))
                    )}
                  </div>
                )}
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
                  "border border-dashed border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all duration-200 text-xs w-full py-2 flex items-center justify-center gap-1.5 h-auto rounded-lg bg-transparent",
                  !isOnline && "cursor-not-allowed opacity-50"
                )}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign Staff</span>
              </Button>
            ) : (
              <span className="text-xs text-slate-400 italic font-medium font-sans">
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
            <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-slate-400">
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
        <div className="pipeline-container font-sans">
          {stagesConfig.map((stage, index) => {
            const assignment = project.project_stage_assignments?.find((a) => a.stage === stage.id);
            const displayStatus = getStageDisplayStatus(stage.id, assignment);
            const isCompleted = displayStatus === "completed";
            const isFailed = displayStatus === "failed";
            const isInProgress = displayStatus === "in_progress";

            // Colors mapping
            let borderClass = "border-slate-800";
            let glowClass = "";
            let statusIcon = <Clock className="w-4 h-4 text-slate-400" />;
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
              borderClass = "border-blue-500/50 bg-blue-950/10";
              glowClass = "shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/30";
              statusIcon = <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
              statusLabel = "In Progress";
            }

            if (stage.id === "proofreading" && (project.status === "proof_ready" || project.status === "report_done")) {
              borderClass = "border-blue-500/50 bg-blue-950/10";
              glowClass = "shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/30";
              statusIcon = <Clock className="w-4 h-4 text-blue-400" />;
              statusLabel = "● Ready for Proofread";
            }

            if (stage.id === "lsmtl_upload") {
              const status = project.status;
              if (status === "report_uploaded" || status === "report_verified" || status === "report_delivered") {
                borderClass = "border-emerald-500/40 bg-emerald-950/5";
                statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
                statusLabel = "Report Uploaded";
              } else if (status === "proof_ready" || status === "report_done") {
                borderClass = "border-blue-500/50 bg-blue-950/10";
                glowClass = "shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/30";
                statusIcon = <Clock className="w-4 h-4 text-blue-400" />;
                statusLabel = "Awaiting Upload";
              } else {
                borderClass = "border-slate-800";
                statusIcon = <Clock className="w-4 h-4 text-slate-400" />;
                statusLabel = "Awaiting previous stages";
              }
            }

            const connectorStatus =
              displayStatus === "completed"
                ? "completed"
                : displayStatus === "in_progress"
                ? "active"
                : "pending";

            return (
              <div
                key={stage.id}
                className={cn(
                  "h-auto flex flex-col justify-start gap-2.5 p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl transition-all hover:border-slate-700",
                  borderClass,
                  glowClass
                )}
              >
                {/* 1. Stage Header */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-all",
                    isCompleted ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-950" :
                    isFailed ? "bg-red-950/60 border-red-500/40 text-red-400 shadow-sm shadow-red-950" :
                    isInProgress ? "bg-blue-950/80 border-blue-500/50 text-blue-400 ring-1 ring-blue-500/30" :
                    "bg-slate-800/80 border-slate-700/50 text-slate-400"
                  )}>
                    <stage.icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                      Stage {index + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-100 tracking-wide">
                      {stage.label}
                    </span>
                  </div>
                </div>

                {/* 2. Assigned Staff Section */}
                <div className="w-full my-1">
                  {stage.id === "lsmtl_upload" ? (
                    <div className="text-center py-1">
                      {project.status === "report_uploaded" || project.status === "report_verified" || project.status === "report_delivered" ? (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Report Uploaded Successfully</span>
                        </span>
                      ) : project.status === "proof_ready" || project.status === "report_done" ? (
                        <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto leading-normal">
                          Awaiting manager to upload the finalized proofread report to LSMTL.
                        </p>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-2 space-y-1">
                          <Upload className="w-6 h-6 text-slate-600"/>
                          <span className="text-xs font-medium text-slate-400">Awaiting prior stage completion</span>
                        </div>
                      )}
                    </div>
                  ) : stage.id === "report_writing" && isProPlan && reportMode === "ai" ? (
                    <div className="flex items-center gap-3 py-1 px-1 h-[48px]">
                      <AvatarCircle initials="AI" className="w-8 h-8 shrink-0 bg-blue-600 text-white font-bold text-xs flex items-center justify-center rounded-full" />
                      <div className="flex flex-col justify-center min-w-0">
                        <p className="text-xs font-bold text-slate-100 truncate leading-tight">Report Bot</p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider leading-tight mt-0.5">AI Generator</p>
                      </div>
                    </div>
                  ) : stage.id === "proofreading" && isProPlan && proofMode === "ai" ? (
                    <div className="flex items-center gap-3 py-1 px-1 h-[48px]">
                      <AvatarCircle initials="AI" className="w-8 h-8 shrink-0 bg-blue-600 text-white font-bold text-xs flex items-center justify-center rounded-full" />
                      <div className="flex flex-col justify-center min-w-0">
                        <p className="text-xs font-bold text-slate-100 truncate leading-tight">Proofread Bot</p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider leading-tight mt-0.5">AI Checker</p>
                      </div>
                    </div>
                  ) : (
                    renderStaffAssignSection(stage, assignment)
                  )}
                </div>

                {/* 3. Status Row (Omitted for stage 5 when awaiting previous stages to avoid duplicate text) */}
                {!(stage.id === "lsmtl_upload" && statusLabel === "Awaiting previous stages") && (
                  <div className="flex items-center justify-between text-[10px] text-slate-400 py-1.5 border-y border-slate-800/60 font-mono">
                    <div className="flex items-center gap-1.5">
                      {statusIcon}
                      <span className="font-semibold">{statusLabel}</span>
                    </div>
                    {isCompleted && assignment?.started_at && assignment?.completed_at && (
                      <span className="text-blue-400 font-semibold">
                        {formatDuration(assignment.started_at, assignment.completed_at)}
                      </span>
                    )}
                  </div>
                )}

                {/* 4. Action Area */}
                <div className="card-action-area">
                  {stage.id === "report_writing" ? (
                    isProPlan ? (
                      <div className="space-y-1.5 mt-auto">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block">
                          Report Writing Mode
                        </span>
                        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800/80 gap-1">
                          <button
                            type="button"
                            onClick={() => setReportMode("staff")}
                            className={cn(
                              "py-1 px-1.5 rounded-lg text-[10px] xl:text-xs font-bold transition-all flex items-center justify-center text-center whitespace-nowrap",
                              reportMode === "staff"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                            )}
                          >
                            Staff
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportMode("ai")}
                            className={cn(
                              "py-1 px-1.5 rounded-lg text-[10px] xl:text-xs font-bold transition-all flex items-center justify-center text-center whitespace-nowrap",
                              reportMode === "ai"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                            )}
                          >
                            Report Bot
                          </button>
                        </div>

                        {reportMode === "ai" && (
                          <div className="mt-3">
                            <Button
                              type="button"
                              onClick={() => setIsReportBotOpen(true)}
                              className="w-full bg-ddt-lime hover:bg-ddt-lime/90 text-black font-bold text-xs py-2.5 px-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>
                                {project.status === "report_bot_draft"
                                  ? "View / Download Draft"
                                  : "Launch Report Bot"}
                              </span>
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <UpgradeHint stage="report_writing" />
                    )
                  ) : stage.id === "proofreading" ? (
                    isProPlan ? (
                      <div className="space-y-1.5 mt-auto">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block">
                          Proofreading Mode
                        </span>
                        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800/80 gap-1">
                          <button
                            type="button"
                            onClick={() => setProofMode("staff")}
                            className={cn(
                              "py-1 px-1.5 rounded-lg text-[10px] xl:text-xs font-bold transition-all flex items-center justify-center text-center whitespace-nowrap",
                              proofMode === "staff"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                            )}
                          >
                            Staff
                          </button>
                          <button
                            type="button"
                            onClick={() => setProofMode("ai")}
                            className={cn(
                              "py-1 px-1.5 rounded-lg text-[10px] xl:text-xs font-bold transition-all flex items-center justify-center text-center whitespace-nowrap",
                              proofMode === "ai"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                            )}
                          >
                            Proofread Bot
                          </button>
                        </div>

                        {proofMode === "ai" && (
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
                      <UpgradeHint stage="proofreading" />
                    )
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* LSMTL Tracking Card */}
          {["report_uploaded", "report_verified", "report_delivered"].includes(project.status || "") && isManager && (
            <LsmtlTrackingCard
              project={project}
              onStatusUpdate={(status) => {
                if (status) {
                  updateLsmtlStatus.mutate({
                    projectId: project.id,
                    lsmtlStatus: status as any,
                  });
                }
              }}
              onProjectComplete={() => {
                utils.projects.list.invalidate();
                utils.projects.getDashboardData.invalidate();
                utils.projects.getById.invalidate({
                  id: project.id,
                });
                router.push("/projects");
              }}
            />
          )}
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
            project.project_stage_assignments?.find((a) => a.stage === assignStage)?.assigned_to ?? undefined
          }
        />
      )}

      {/* Proof Review Modal */}
      <ProofReviewModal
        isOpen={isProofOpen}
        onOpenChange={setIsProofOpen}
        projectId={project.id}
      />

      {/* Report Bot Modal Pop-up */}
      <ReportBotPanel
        project={{
          id: project.id,
          ndt_code: project.ndt_code || "",
          client_name: project.client_name || "",
          status: project.status || "",
        }}
        isOpen={isReportBotOpen}
        onOpenChange={setIsReportBotOpen}
      />
    </div>
  );
}
