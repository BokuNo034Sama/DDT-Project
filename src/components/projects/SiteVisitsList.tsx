"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { SiteVisitModal } from "./SiteVisitModal";
import { useToast } from "@/hooks/use-toast";
import { UserPill } from "@/components/ui/UserPill";
import { 
  CalendarDays, 
  Layers, 
  Plus, 
  Trash2, 
  Loader2, 
  Landmark, 
  FileText, 
  ClipboardList 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { ProjectWithRelations } from "@/types";

interface SiteVisitsListProps {
  project: ProjectWithRelations;
}

export function SiteVisitsList({ project }: SiteVisitsListProps) {
  const { toast } = useToast();
  const isOnline = useNetworkStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // States for instructions editor
  const [editingInstructionText, setEditingInstructionText] = useState<string>("");
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);

  const { data: me } = trpc.staff.getMe.useQuery();
  const role = me?.role || null;

  const isManager = role === "ops_manager" || role === "lab_owner" || role === "super_admin";

  const utils = trpc.useUtils();
  
  const { data: visitsList, isLoading: loadingVisits } = trpc.siteVisits.listByProject.useQuery({
    projectId: project.id,
  });

  const { data: logsList } = trpc.siteVisits.getInspectionDataByProject.useQuery({
    projectId: project.id,
  });

  const assignInstructionMutation = trpc.siteVisits.assignVisitInstruction.useMutation({
    onSuccess: () => {
      toast({
        title: "Instructions Updated",
        description: "Manager reminders have been saved and dispatched to the Team Leader.",
      });
      utils.siteVisits.getInspectionDataByProject.invalidate({ projectId: project.id });
      setIsInstructionOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to save instructions",
        description: error.message || "Failed to update manager instruction note.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = trpc.siteVisits.remove.useMutation({
    onSuccess: () => {
      toast({
        title: "Site Visit Deleted",
        description: "The site visit record has been removed.",
      });
      utils.projects.getById.invalidate({ id: project.id });
      utils.siteVisits.listByProject.invalidate({ projectId: project.id });
      setDeletingId(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete record",
        description: error.message || "Failed to remove site visit record.",
        variant: "destructive",
      });
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate({ siteVisitId: id });
  };

  const handleOpenEditInstruction = (currentText: string) => {
    setEditingInstructionText(currentText);
    setIsInstructionOpen(true);
  };

  const handleSaveInstruction = (e: React.FormEvent) => {
    e.preventDefault();
    assignInstructionMutation.mutate({
      projectId: project.id,
      managerInstructionNote: editingInstructionText,
    });
  };

  const visits = visitsList || [];

  return (
    <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md p-6 flex flex-col h-full justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-ddt-muted flex items-center gap-2">
            <Landmark className="w-4 h-4 text-ddt-accent" />
            <span>Site Visits Log</span>
          </h2>
          {isManager && (
            <Button
              onClick={() => isOnline && setIsModalOpen(true)}
              disabled={!isOnline}
              className={cn(
                "border border-ddt-border text-ddt-text text-xs h-8 py-1 px-3 rounded gap-1.5 transition-all duration-200",
                isOnline
                  ? "bg-ddt-raised hover:bg-ddt-border hover:border-ddt-accent hover:text-ddt-accent"
                  : "cursor-not-allowed opacity-50 bg-ddt-input"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Visit</span>
            </Button>
          )}
        </div>

        {/* List of Visits */}
        {loadingVisits ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-ddt-accent" />
          </div>
        ) : visits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-ddt-input/20 border border-dashed border-ddt-border rounded-lg p-6">
            <CalendarDays className="w-8 h-8 text-ddt-faint mb-2" />
            <p className="text-xs text-ddt-muted font-medium">No site visits recorded yet</p>
            {isManager && (
              <p className="text-[10px] text-ddt-faint mt-1">
                Click "Add Visit" to log attending technicians.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 pr-1">
            {visits.map((visit) => {
              const staffName = visit.staff_user?.full_name || "Unknown Technician";
              const initials = staffName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2);

              // Find active or completed site visit log matching this team lead
              const matchedLog = (logsList || []).find(
                (l) => l.team_lead_id === visit.staff_id
              );
              const hasInstruction = !!matchedLog?.manager_instruction_note;
              const instructionText = matchedLog?.manager_instruction_note || "";

              return (
                <div
                  key={visit.id}
                  className="flex items-center justify-between gap-4 p-3 bg-ddt-input border border-ddt-border/50 rounded-lg hover:border-ddt-border transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserPill name={staffName} avatarInitials={initials} className="bg-ddt-raised shrink-0" />
                    
                    <div className="flex flex-col min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ddt-muted font-mono">
                        <span className="whitespace-nowrap">
                          {new Date(visit.visit_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                          })}
                        </span>
                        {visit.number_of_floors !== null && (
                          <span className="flex items-center gap-1 text-[10px] bg-ddt-accent-bg border border-ddt-accent/15 text-ddt-accent px-1.5 py-0.5 rounded leading-none">
                            <Layers className="w-3 h-3" />
                            <span>{visit.number_of_floors} F</span>
                          </span>
                        )}
                        {visit.is_team_leader && (
                          <span className="text-[9px] bg-ddt-accent/10 border border-ddt-accent/30 text-ddt-accent px-1 py-0.5 rounded leading-none font-bold uppercase font-mono tracking-wider">
                            Team Lead
                          </span>
                        )}
                      </div>

                      {/* Instruction Display */}
                      {visit.is_team_leader && (
                        <div className="mt-1.5 flex flex-col gap-1 text-[11px] text-ddt-muted">
                          {hasInstruction ? (
                            <div className="flex items-start gap-1 bg-ddt-input border border-ddt-border/30 rounded p-1.5 max-w-[240px]">
                              <FileText className="w-3.5 h-3.5 text-ddt-accent shrink-0 mt-0.5" />
                              <span className="leading-normal line-clamp-2" title={instructionText}>
                                {instructionText}
                              </span>
                            </div>
                          ) : (
                            <span className="text-ddt-faint italic">No instructions set</span>
                          )}

                          {isManager && (visit.status === "pending" || visit.status === "in_progress") && (
                            <button
                              onClick={() => handleOpenEditInstruction(instructionText)}
                              className="text-ddt-accent hover:underline text-[10px] font-mono leading-none focus:outline-none w-fit mt-0.5"
                            >
                              {hasInstruction ? "Edit Instruction" : "+ Add Instruction"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isManager && (
                    <button
                      onClick={() => handleDelete(visit.id)}
                      disabled={deletingId === visit.id || !isOnline}
                      className={cn(
                        "p-1.5 rounded transition-all duration-150 shrink-0",
                        isOnline
                          ? "text-ddt-faint hover:text-red-400 hover:bg-red-400/5"
                          : "text-ddt-faint opacity-55 cursor-not-allowed"
                      )}
                      title="Delete log"
                    >
                      {deletingId === visit.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Site Visit Modal */}
      <SiteVisitModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        project={project}
      />

      {/* Edit Instruction Dialog */}
      <Dialog open={isInstructionOpen} onOpenChange={setIsInstructionOpen}>
        <DialogContent className="bg-ddt-surface border border-ddt-border text-ddt-text max-w-md w-[95%] sm:w-full rounded-xl">
          <DialogHeader className="text-left">
            <DialogTitle className="font-syne text-lg font-bold text-ddt-accent uppercase tracking-wide flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              <span>Inspection Instructions</span>
            </DialogTitle>
            <DialogDescription className="text-ddt-muted text-xs">
              Provide context, reminders, or facade testing instructions for the assigned Team Leader.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveInstruction} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="instruction-text" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">
                Instructions / Reminders Note
              </Label>
              <textarea
                id="instruction-text"
                rows={4}
                value={editingInstructionText}
                onChange={(e) => setEditingInstructionText(e.target.value)}
                placeholder="Enter reminders e.g., inspect southern facade carefully, safety harness required for level 4, verify calibrator serial number..."
                className="w-full bg-ddt-input border border-ddt-border focus:border-ddt-accent focus:ring-1 focus:ring-ddt-accent rounded-md py-2.5 px-3 text-sm text-ddt-text placeholder:text-ddt-faint focus:outline-none resize-none leading-relaxed"
                required
              />
            </div>

            <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsInstructionOpen(false)}
                className="text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised order-2 sm:order-1"
                disabled={assignInstructionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-ddt-accent text-black font-semibold hover:bg-ddt-accent/90 order-1 sm:order-2"
                disabled={assignInstructionMutation.isPending}
              >
                {assignInstructionMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </span>
                ) : (
                  <span>Dispatch Instructions</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
