"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ProjectWithRelations } from "@/types";

interface SiteVisitModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithRelations;
  onSuccess?: () => void;
}

export function SiteVisitModal({
  isOpen,
  onOpenChange,
  project,
  onSuccess,
}: SiteVisitModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [leaderStaffId, setLeaderStaffId] = useState<string | null>(null);
  const [instructionNote, setInstructionNote] = useState("");

  const [equipmentChecks, setEquipmentChecks] = useState<Array<{
    equipmentId: string;
    equipmentName: string;
    serialNumber: string;
    transducerOk: boolean;
    displayOk: boolean;
    cablesOk: boolean;
    batteryStatus: string;
  }>>([]);

  const { register, getValues, reset } = useForm<{ floors: number | "" }>({
    defaultValues: {
      floors: project?.number_of_floors ?? "",
    },
  });

  // Get active staff members in the tenant
  const { data: staffList, isLoading: loadingStaff } = trpc.staff.list.useQuery({ role: "staff" });

  // Get active equipment in the tenant
  const { data: equipmentList, isLoading: loadingEquipment } = trpc.equipment.listEquipment.useQuery(undefined, {
    enabled: isOpen && step === 2,
  });

  // Sync leader selection when selectedStaffIds changes
  useEffect(() => {
    if (selectedStaffIds.length === 0) {
      setLeaderStaffId(null);
    } else if (!leaderStaffId || !selectedStaffIds.includes(leaderStaffId)) {
      setLeaderStaffId(selectedStaffIds[0]);
    }
  }, [selectedStaffIds, leaderStaffId]);

  // Sync state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        floors: project?.number_of_floors ?? "",
      });
      setStep(1);
      setEquipmentChecks([]);
    }
  }, [isOpen, project?.number_of_floors, reset]);

  const utils = trpc.useUtils();
  const addVisitMutation = trpc.siteVisits.add.useMutation({
    onSuccess: async () => {
      toast({
        title: "Site Visit Logged",
        description: "Site attendance and equipment checks recorded successfully.",
      });

      await utils.projects.getById.invalidate({ id: project.id });
      await utils.staff.list.invalidate();
      await utils.projects.getDashboardData.invalidate();
      await utils.projects.getOnboardingStatus.invalidate();
      await utils.siteVisits.listByProject.invalidate({ projectId: project.id });

      onOpenChange(false);
      setSelectedStaffIds([]);
      setLeaderStaffId(null);
      setVisitDate(new Date().toISOString().split("T")[0]);
      setInstructionNote("");
      setEquipmentChecks([]);
      setStep(1);
      reset({
        floors: project?.number_of_floors ?? "",
      });
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

  const toggleEquipmentSelection = (eq: any) => {
    setEquipmentChecks((prev) => {
      const exists = prev.find((item) => item.equipmentId === eq.id);
      if (exists) {
        return prev.filter((item) => item.equipmentId !== eq.id);
      } else {
        return [
          ...prev,
          {
            equipmentId: eq.id,
            equipmentName: eq.equipment_name,
            serialNumber: eq.serial_number,
            transducerOk: true,
            displayOk: true,
            cablesOk: true,
            batteryStatus: "100%",
          },
        ];
      }
    });
  };

  const updateCheck = (eqId: string, field: "transducerOk" | "displayOk" | "cablesOk", val: boolean) => {
    setEquipmentChecks((prev) =>
      prev.map((item) => (item.equipmentId === eqId ? { ...item, [field]: val } : item))
    );
  };

  const updateBattery = (eqId: string, val: string) => {
    setEquipmentChecks((prev) =>
      prev.map((item) => (item.equipmentId === eqId ? { ...item, batteryStatus: val } : item))
    );
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

    if (step === 1) {
      setStep(2);
      return;
    }

    const floorsValue = getValues("floors");
    addVisitMutation.mutate({
      projectId: project.id,
      staffIds: selectedStaffIds,
      visitDate,
      numberOfFloors: floorsValue === "" || floorsValue === undefined ? undefined : Number(floorsValue),
      leaderStaffId: leaderStaffId ?? undefined,
      managerInstructionNote: instructionNote || undefined,
      equipmentChecks: equipmentChecks.map(eq => ({
        equipmentId: eq.equipmentId,
        transducerOk: eq.transducerOk,
        displayOk: eq.displayOk,
        cablesOk: eq.cablesOk,
        batteryStatus: eq.batteryStatus,
      })),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        key={project?.id ? `visit-modal-${project.id}` : 'visit-modal-loading'}
        className="bg-ddt-surface border border-ddt-border text-ddt-text max-w-md w-[95%] sm:w-full rounded-xl"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="font-syne text-lg font-bold text-ddt-accent uppercase tracking-wide flex items-center gap-2">
            <CalendarRange className="w-5 h-5" />
            <span>{step === 1 ? "Log Site Attendance" : "Verify Equipment Used"}</span>
          </DialogTitle>
          <DialogDescription className="text-ddt-muted text-xs">
            {step === 1
              ? "Record which staff members attended the site, the date, and the number of floors they surveyed."
              : "Verify the working condition and battery levels of the lab equipment used on site."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {step === 1 && (
            <>
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
                  defaultValue={project?.number_of_floors}
                  {...register("floors")}
                  placeholder="e.g. 3"
                  className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-sm"
                />
              </div>

              {/* Contextual Instructions / Reminders */}
              <div className="space-y-1.5">
                <Label htmlFor="instructionNote" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">
                  Instructions / Reminders (Optional)
                </Label>
                <textarea
                  id="instructionNote"
                  rows={3}
                  value={instructionNote}
                  onChange={(e) => setInstructionNote(e.target.value)}
                  placeholder="Enter contextual instructions, facade access notes, safety reminders..."
                  className="w-full bg-ddt-input border border-ddt-border focus:border-ddt-accent focus:ring-1 focus:ring-ddt-accent rounded-md py-2 px-3 text-sm text-ddt-text placeholder:text-ddt-faint focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Designate Team Leader */}
              {selectedStaffIds.length > 0 && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <Label className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">
                    Designate Team Leader *
                  </Label>
                  <Select
                    value={leaderStaffId || ""}
                    onValueChange={(val) => setLeaderStaffId(val)}
                  >
                    <SelectTrigger className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-sm">
                      <SelectValue placeholder="Select team leader" />
                    </SelectTrigger>
                    <SelectContent className="bg-ddt-surface border-ddt-border text-ddt-text">
                      {selectedStaffIds.map((id) => {
                        const member = staffList?.find((s: any) => s.id === id);
                        return (
                          <SelectItem key={id} value={id}>
                            {member?.full_name || "Unknown Staff"}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
            </>
          )}

          {step === 2 && (
            <div className="space-y-4 py-2 animate-in fade-in duration-200">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">
                  Which equipment was used on this site visit?
                </Label>
                <p className="text-[11px] text-ddt-faint">
                  Select all equipment used and log their initial functional checks.
                </p>
              </div>

              {loadingEquipment ? (
                <div className="flex items-center gap-2 py-4 justify-center text-sm text-ddt-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-ddt-accent" />
                  <span>Loading equipment registry...</span>
                </div>
              ) : equipmentList && equipmentList.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {equipmentList.map((eq: any) => {
                    const isSelected = equipmentChecks.some((c) => c.equipmentId === eq.id);
                    const currentCheck = equipmentChecks.find((c) => c.equipmentId === eq.id);

                    return (
                      <div
                        key={eq.id}
                        className={`border rounded-xl p-3 space-y-3 transition-all ${
                          isSelected
                            ? "bg-ddt-accent/5 border-ddt-accent/40"
                            : "bg-ddt-input border-ddt-border hover:border-ddt-border-strong"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleEquipmentSelection(eq)}
                          className="flex items-center gap-3 w-full text-left focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4.5 h-4.5 text-ddt-accent shrink-0" />
                          ) : (
                            <Square className="w-4.5 h-4.5 text-ddt-border shrink-0" />
                          )}
                          <div className="flex-1">
                            <h5 className="text-xs font-bold text-ddt-text">{eq.equipment_name}</h5>
                            <p className="text-[10px] text-ddt-muted font-mono mt-0.5">S/N: {eq.serial_number}</p>
                          </div>
                          <span className="text-[9px] font-mono uppercase bg-ddt-raised border border-ddt-border px-1.5 py-0.5 rounded text-ddt-muted font-bold">
                            {eq.equipment_type}
                          </span>
                        </button>

                        {isSelected && currentCheck && (
                          <div className="pl-7.5 space-y-2 pt-2 border-t border-ddt-border/40 animate-in slide-in-from-top-1 duration-150">
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => updateCheck(eq.id, "transducerOk", !currentCheck.transducerOk)}
                                className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold text-center transition-all ${
                                  currentCheck.transducerOk
                                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                                    : "bg-red-950/20 border-red-500/30 text-red-400"
                                }`}
                              >
                                Transducer: {currentCheck.transducerOk ? "OK" : "NOT OK"}
                              </button>
                              <button
                                type="button"
                                onClick={() => updateCheck(eq.id, "cablesOk", !currentCheck.cablesOk)}
                                className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold text-center transition-all ${
                                  currentCheck.cablesOk
                                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                                    : "bg-red-950/20 border-red-500/30 text-red-400"
                                }`}
                              >
                                Cables: {currentCheck.cablesOk ? "OK" : "NOT OK"}
                              </button>
                              <button
                                type="button"
                                onClick={() => updateCheck(eq.id, "displayOk", !currentCheck.displayOk)}
                                className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold text-center transition-all ${
                                  currentCheck.displayOk
                                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                                    : "bg-red-950/20 border-red-500/30 text-red-400"
                                }`}
                              >
                                Display: {currentCheck.displayOk ? "OK" : "NOT OK"}
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-ddt-muted font-semibold uppercase tracking-wider shrink-0">Battery Level:</span>
                              <select
                                value={currentCheck.batteryStatus}
                                onChange={(e) => updateBattery(eq.id, e.target.value)}
                                className="bg-ddt-input border border-ddt-border text-ddt-text text-xs rounded-lg py-1 px-2 focus:outline-none focus:border-ddt-accent flex-1"
                              >
                                <option value="100%">100%</option>
                                <option value="75%">75%</option>
                                <option value="50%">50%</option>
                                <option value="25%">25%</option>
                                <option value="Low">Low</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 border border-dashed border-ddt-border rounded-xl text-center space-y-2">
                  <p className="text-xs text-ddt-muted">No equipment registered in settings yet.</p>
                  <p className="text-[10px] text-ddt-faint">You can continue logging the site visit, but equipment check verification details will not be added to report drafts.</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 pt-2">
            {step === 2 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised"
                disabled={addVisitMutation.isPending}
              >
                ← Back
              </Button>
            )}
            {step === 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised order-2 sm:order-1"
                disabled={addVisitMutation.isPending}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="bg-ddt-accent text-black font-semibold hover:bg-ddt-accent/90 order-1 sm:order-2 ml-auto"
              disabled={addVisitMutation.isPending || loadingStaff}
            >
              {addVisitMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging...</span>
                </span>
              ) : (
                <span>{step === 1 ? "Next: Equipment Used →" : "Log Site Visit"}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
