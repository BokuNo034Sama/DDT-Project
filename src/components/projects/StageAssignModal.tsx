"use client";

import { useState, useEffect } from "react";
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
import { Loader2, UserCheck } from "lucide-react";

interface StageAssignModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  stage: "analysis" | "sketch" | "report_writing" | "proofreading";
  currentAssigneeId?: string;
  onSuccess?: () => void;
}

export function StageAssignModal({
  isOpen,
  onOpenChange,
  projectId,
  stage,
  currentAssigneeId,
  onSuccess,
}: StageAssignModalProps) {
  const { toast } = useToast();
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  // Get active staff members in the tenant
  const { data: staffList, isLoading } = trpc.staff.list.useQuery();

  const staffOptions = staffList ?? [];

  const utils = trpc.useUtils();
  const assignMutation = trpc.stages.assign.useMutation({
    onSuccess: async () => {
      const assignedUser = staffOptions.find((u: any) => u.id === selectedStaffId);
      const nameStr = assignedUser ? assignedUser.full_name : "Unassigned";

      toast({
        title: "Assignment Updated",
        description: `Successfully assigned the ${stage.replace("_", " ")} stage to ${nameStr}.`,
      });

      // 1. Force the parent project dashboard timeline to reload explicitly
      await utils.projects.getById.invalidate({ id: projectId });
      
      // 2. Force the active team directory lists to sync
      await utils.staff.list.invalidate();
      
      // 3. Force the global operations dashboard widgets to recalculate
      await utils.projects.getDashboardData.invalidate();
      await utils.projects.getOnboardingStatus.invalidate();
      
      // 4. Trigger form close actions here
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to update assignment.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedStaffId(currentAssigneeId || "unassigned");
    }
  }, [isOpen, currentAssigneeId]);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedTo = selectedStaffId === "unassigned" ? null : selectedStaffId;
    assignMutation.mutate({
      projectId,
      stage,
      assignedTo,
    });
  };

  const getStageTitle = (s: string) => {
    switch (s) {
      case "analysis":
        return "Analysis Stage";
      case "sketch":
        return "Sketch Stage";
      case "report_writing":
        return "Report Writing Stage";
      case "proofreading":
        return "Proofreading Stage";
      default:
        return "Project Stage";
    }
  };

  if (isLoading) return <div>Loading staff...</div>;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-ddt-surface border border-ddt-border text-ddt-text max-w-md w-[95%] sm:w-full rounded-xl">
        <DialogHeader className="text-left">
          <DialogTitle className="font-syne text-lg font-bold text-ddt-accent uppercase tracking-wide flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            <span>Assign Staff</span>
          </DialogTitle>
          <DialogDescription className="text-ddt-muted text-xs">
            Assign a qualified team member to take ownership of the **{getStageTitle(stage)}**.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAssign} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="staff-select" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">
              Assignee
            </Label>
            <select
              id="staff-select"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              defaultValue={currentAssigneeId}
              className="w-full bg-ddt-input border border-ddt-border text-ddt-text rounded-md py-2.5 px-3 focus:outline-none focus:border-ddt-accent focus:ring-1 focus:ring-ddt-accent text-sm"
            >
              <option value="unassigned" className="bg-ddt-surface">
                Unassigned
              </option>
              {staffOptions.map((member: any) => (
                <option key={member.id} value={member.id} className="bg-ddt-surface">
                  {member.full_name} ({member.role.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised order-2 sm:order-1"
              disabled={assignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-ddt-accent text-black font-semibold hover:bg-ddt-accent/90 order-1 sm:order-2"
              disabled={assignMutation.isPending || isLoading}
            >
              {assignMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning...</span>
                </span>
              ) : (
                <span>Assign Staff</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
