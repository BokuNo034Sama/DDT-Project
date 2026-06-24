"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
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

  const supabase = createClient();

  useEffect(() => {
    if (!supabase || typeof supabase.channel !== "function") return;

    const channel = supabase
      .channel(`project-visits-${project.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_visits",
          filter: `project_id=eq.${project.id}`,
        },
        () => {
          utils.siteVisits.listByProject.invalidate({ projectId: project.id });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_visit_logs",
          filter: `project_id=eq.${project.id}`,
        },
        () => {
          utils.siteVisits.getInspectionDataByProject.invalidate({ projectId: project.id });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id, supabase, utils]);

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

              const avatarInitials = initials;
              const isTeamLead = visit.is_team_leader;
              const TrashIcon = Trash2;
              const formattedDate = new Date(visit.visit_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const floorCount = visit.number_of_floors || 0;

              return (
                <div
                  key={visit.id}
                  className="relative w-full p-4 border border-slate-800 bg-[#0d1527] hover:border-slate-700 transition-colors flex flex-col space-y-3 rounded-xl"
                >
                  {/* HEADER ROW: Identity Grouping & Fixed Actions */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      {/* User Avatar */}
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase border border-blue-500/30">
                        {avatarInitials}
                      </div>
                      {/* Name and Role Cluster */}
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white tracking-wide">{staffName}</span>
                        {isTeamLead && (
                          <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-sky-400 mt-0.5">
                            ✦ Team Leader
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Fixed Action Anchor */}
                    {isManager && (
                      <button
                        onClick={() => handleDelete(visit.id)}
                        disabled={deletingId === visit.id || !isOnline}
                        className={cn(
                          "p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all absolute top-3 right-3",
                          (!isOnline || deletingId === visit.id) && "opacity-55 cursor-not-allowed"
                        )}
                        title="Delete Site Visit"
                      >
                        {deletingId === visit.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* METADATA STRIP: Structural Parameters & Scheduling */}
                  <div className="flex items-center space-x-3 pt-1 border-t border-slate-800/60 w-full text-xs text-slate-400">
                    <span className="font-medium text-slate-300">{formattedDate}</span>
                    <span className="text-slate-600">•</span>
                    {/* Floor Target Badge */}
                    <span className="bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-500/20 text-[10px] uppercase tracking-wider">
                      {floorCount} Floors
                    </span>
                  </div>

                  {/* CONTEXT CALLOUT: Management Directives */}
                  <div className="text-xs text-slate-500 italic bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/40 w-full flex flex-col gap-1.5">
                    <span className="leading-normal">
                      {instructionText || "No custom deployment instructions specified by management."}
                    </span>
                    {isManager && visit.is_team_leader && (visit.status === "pending" || visit.status === "in_progress") && (
                      <button
                        onClick={() => handleOpenEditInstruction(instructionText)}
                        className="text-ddt-accent hover:underline text-[10px] font-mono leading-none focus:outline-none w-fit mt-1 not-italic"
                      >
                        {hasInstruction ? "Edit Instruction" : "+ Add Instruction"}
                      </button>
                    )}
                  </div>
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
