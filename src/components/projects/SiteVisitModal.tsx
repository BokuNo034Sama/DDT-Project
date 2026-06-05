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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc/client";
import { Loader2, CalendarRange, CheckSquare, Square } from "lucide-react";

interface SiteVisitModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function SiteVisitModal({
  isOpen,
  onOpenChange,
  projectId,
  onSuccess,
}: SiteVisitModalProps) {
  const { toast } = useToast();
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [numberOfFloors, setNumberOfFloors] = useState<number | "">("");

  // Get active staff members in the tenant
  const { data: staffList, isLoading: loadingStaff } = trpc.staff.list.useQuery({ role: "staff" });

  const utils = trpc.useUtils();
  const addVisitMutation = trpc.siteVisits.add.useMutation({
    onSuccess: () => {
      toast({
        title: "Site Visit Logged",
        description: "Site attendance has been recorded successfully.",
      });

      utils.projects.getById.invalidate({ id: projectId });
      onOpenChange(false);
      // Reset form states
      setSelectedStaffIds([]);
      setVisitDate(new Date().toISOString().split("T")[0]);
      setNumberOfFloors("");
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to log visit",
        description: error.message || "Failed to add site visit record.",
        variant: "destructive",
      });
    },
  });

  const toggleStaff = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((staffId) => staffId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (!staffList) return;
    const activeStaff = staffList.filter((s: any) => s.is_active !== false);
    if (selectedStaffIds.length === activeStaff.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(activeStaff.map((s: any) => s.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStaffIds.length === 0) {
      toast({
        title: "No staff selected",
        description: "Please select at least one staff member who attended.",
        variant: "destructive",
      });
      return;
    }

    if (!visitDate) {
      toast({
        title: "Date required",
        description: "Please specify the date of the site visit.",
        variant: "destructive",
      });
      return;
    }

    addVisitMutation.mutate({
      projectId,
      staffIds: selectedStaffIds,
      visitDate,
      numberOfFloors: numberOfFloors === "" ? undefined : Number(numberOfFloors),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-ddt-surface border border-ddt-border text-ddt-text max-w-md w-[95%] sm:w-full rounded-xl">
        <DialogHeader className="text-left">
          <DialogTitle className="font-syne text-lg font-bold text-ddt-accent uppercase tracking-wide flex items-center gap-2">
            <CalendarRange className="w-5 h-5" />
            <span>Log Site Attendance</span>
          </DialogTitle>
          <DialogDescription className="text-ddt-muted text-xs">
            Record which staff members attended the site, the date, and the number of floors they surveyed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Visit Date */}
          <div className="space-y-1.5">
            <Label htmlFor="visit-date" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">
              Visit Date *
            </Label>
            <Input
              id="visit-date"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-sm"
              required
            />
          </div>

          {/* Number of floors */}
          <div className="space-y-1.5">
            <Label htmlFor="floors" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">
              Number of Floors Surveyed (Optional)
            </Label>
            <Input
              id="floors"
              type="number"
              min={0}
              value={numberOfFloors}
              onChange={(e) => setNumberOfFloors(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 3"
              className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-sm"
            />
          </div>

          {/* Staff Checkbox List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">
                Select Attending Staff *
              </Label>
              {staffList && staffList.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-ddt-accent hover:underline focus:outline-none"
                >
                  {selectedStaffIds.length === staffList.filter((s: any) => s.is_active !== false).length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            {loadingStaff ? (
              <div className="flex items-center gap-2 py-2 text-sm text-ddt-muted">
                <Loader2 className="w-4 h-4 animate-spin text-ddt-accent" />
                <span>Loading staff list...</span>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto bg-ddt-input border border-ddt-border rounded-md p-2 space-y-1.5">
                {staffList
                  ?.filter((s: any) => s.is_active !== false)
                  .map((member: any) => {
                    const isChecked = selectedStaffIds.includes(member.id);
                    return (
                      <button
                        type="button"
                        key={member.id}
                        onClick={() => toggleStaff(member.id)}
                        className={`flex items-center gap-3 w-full p-2 rounded text-left text-sm transition-all focus:outline-none ${
                          isChecked
                            ? "bg-ddt-accent/5 text-ddt-text"
                            : "hover:bg-ddt-raised text-ddt-muted hover:text-ddt-text"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4.5 h-4.5 text-ddt-accent shrink-0" />
                        ) : (
                          <Square className="w-4.5 h-4.5 text-ddt-border shrink-0" />
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium leading-none">{member.full_name}</span>
                          <span className="text-[10px] text-ddt-faint uppercase tracking-wide mt-1">
                            {member.role.replace("_", " ")}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                {(!staffList || staffList.length === 0) && (
                  <span className="text-xs text-ddt-faint italic p-2 block">
                    No active staff members found.
                  </span>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised order-2 sm:order-1"
              disabled={addVisitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-ddt-accent text-black font-semibold hover:bg-ddt-accent/90 order-1 sm:order-2"
              disabled={addVisitMutation.isPending || loadingStaff}
            >
              {addVisitMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging...</span>
                </span>
              ) : (
                <span>Log Site Attendance</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
