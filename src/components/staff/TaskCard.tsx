"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { UserPill } from "@/components/ui/UserPill";
import { NdtCode } from "@/components/ui/NdtCode";
import { 
  Play, 
  CheckCircle, 
  Clock, 
  User, 
  Activity, 
  Brush, 
  FileText, 
  FileCheck,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  assignment: {
    id: string;
    project_id: string;
    stage: "analysis" | "sketch" | "report_writing" | "proofreading";
    status: "pending" | "in_progress" | "completed" | "failed";
    assigned_at: string;
    project: {
      id: string;
      ndt_code: string;
      client_name: string;
      status: string;
      address: string;
    };
    assigned_by_user?: {
      id: string;
      full_name: string;
      role: string;
    } | null;
  };
  onSuccess?: () => void;
}

export function TaskCard({ assignment, onSuccess }: TaskCardProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [loading, setLoading] = useState(false);

  const startMutation = trpc.stages.start.useMutation({
    onSuccess: () => {
      toast({
        title: "Task Started",
        description: `You have started work on the ${getStageLabel(assignment.stage)} stage.`,
      });
      utils.stages.getMyStages.invalidate();
      utils.projects.getById.invalidate();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error starting task",
        description: error.message || "Failed to start the task.",
        variant: "destructive",
      });
    },
  });

  const completeMutation = trpc.stages.complete.useMutation({
    onSuccess: () => {
      toast({
        title: "Task Completed",
        description: `Successfully completed the ${getStageLabel(assignment.stage)} stage.`,
      });
      utils.stages.getMyStages.invalidate();
      utils.projects.getById.invalidate();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error completing task",
        description: error.message || "Failed to complete the task.",
        variant: "destructive",
      });
    },
  });

  const handleStart = () => {
    startMutation.mutate({ assignmentId: assignment.id });
  };

  const handleComplete = () => {
    completeMutation.mutate({ assignmentId: assignment.id });
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "analysis": return <Activity className="w-4 h-4 text-cyan-400" />;
      case "sketch": return <Brush className="w-4 h-4 text-purple-400" />;
      case "report_writing": return <FileText className="w-4 h-4 text-ddt-accent" />;
      case "proofreading": return <FileCheck className="w-4 h-4 text-emerald-400" />;
      default: return <Clock className="w-4 h-4 text-ddt-muted" />;
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "analysis": return "Analysis";
      case "sketch": return "Sketch";
      case "report_writing": return "Report Writing";
      case "proofreading": return "Proofreading";
      default: return stage;
    }
  };

  const isPending = assignment.status === "pending";
  const isInProgress = assignment.status === "in_progress";
  const isMutating = startMutation.isPending || completeMutation.isPending;

  return (
    <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md p-6 flex flex-col justify-between hover:border-ddt-border-accent transition-all duration-200">
      <div className="space-y-4">
        {/* Task Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-ddt-muted uppercase tracking-wider font-mono block">
              Project Code
            </span>
            <NdtCode code={assignment.project.ndt_code} className="text-base" />
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border font-mono",
            isInProgress 
              ? "bg-ddt-accent/10 border-ddt-accent/30 text-ddt-accent animate-pulse" 
              : "bg-ddt-raised border-ddt-border text-ddt-muted"
          )}>
            {getStageIcon(assignment.stage)}
            <span>{getStageLabel(assignment.stage)}</span>
          </div>
        </div>

        {/* Task Details */}
        <div className="space-y-2.5 border-t border-ddt-border/30 pt-3">
          <div>
            <span className="text-[10px] text-ddt-muted uppercase tracking-wider font-mono block">
              Client
            </span>
            <span className="text-sm font-semibold text-ddt-text">
              {assignment.project.client_name}
            </span>
          </div>
          
          <div>
            <span className="text-[10px] text-ddt-muted uppercase tracking-wider font-mono block">
              Location / Address
            </span>
            <span className="text-xs text-ddt-muted font-sans line-clamp-2">
              {assignment.project.address}
            </span>
          </div>

          {assignment.assigned_by_user && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <div>
                <span className="text-[10px] text-ddt-muted uppercase tracking-wider font-mono block">
                  Assigned By
                </span>
                <span className="text-xs font-semibold text-ddt-text">
                  {assignment.assigned_by_user.full_name}
                </span>
              </div>
              <span className="text-[10px] text-ddt-muted font-mono self-end">
                {new Date(assignment.assigned_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 48px Touch-Target Buttons */}
      <div className="mt-6 pt-3 border-t border-ddt-border/30">
        {isPending && (
          <Button
            onClick={handleStart}
            disabled={isMutating}
            className="w-full bg-ddt-lime hover:bg-ddt-lime/90 text-black font-semibold h-[48px] rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-ddt-lime/5"
          >
            {isMutating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                <span>Starting Task...</span>
              </span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Task</span>
              </>
            )}
          </Button>
        )}

        {isInProgress && (
          <Button
            onClick={handleComplete}
            disabled={isMutating}
            className="w-full bg-ddt-lime hover:bg-ddt-lime/90 text-black font-semibold h-[48px] rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-ddt-lime/5"
          >
            {isMutating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                <span>Completing...</span>
              </span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Mark Complete</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
