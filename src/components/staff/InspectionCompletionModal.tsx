"use client";

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Camera, FileText, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InspectionCompletionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  visitDate: string;
  projectCode: string;
  clientName: string;
  onSuccess?: () => void;
}

interface UploadedSlot {
  url: string; // Base64 data URL
  type: string; // label hierarchy
  capturedAt: string; // ISO datetime
}

const slotConfigs = [
  { id: 1, label: "Front View", helper: "Capture the primary perimeter entrance or main structural facade cleanly.", required: true },
  { id: 2, label: "Overview", helper: "Step back to secure a wide-angle reference composition of the active workspace.", required: true },
  { id: 3, label: "Test Process", helper: "Photograph the equipment configuration, NDT calibration setups, or active testing.", required: true },
  { id: 4, label: "Group Picture", helper: "Secure an operational group image of onsite personnel for compliance verification.", required: true },
  { id: 5, label: "Additional Evidence A", helper: "Supplementary detail shot documenting structural variances or technical anomalies.", required: false },
  { id: 6, label: "Additional Evidence B", helper: "Supplementary detail shot documenting structural variances or technical anomalies.", required: false },
];

export function InspectionCompletionModal({
  isOpen,
  onOpenChange,
  projectId,
  visitDate,
  projectCode,
  clientName,
  onSuccess,
}: InspectionCompletionModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);

  // Form states
  const [fieldNotes, setFieldNotes] = useState("");
  const [slots, setSlots] = useState<{ [key: number]: UploadedSlot | null }>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });

  const [compressing, setCompressing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch active instructions
  const { data: logs } = trpc.siteVisits.getInspectionDataByProject.useQuery(
    { projectId },
    { enabled: isOpen }
  );

  const activeLog = logs?.find((l) => l.status === "assigned");
  const instructionNote = activeLog?.manager_instruction_note || "";

  const utils = trpc.useUtils();
  const submitMutation = trpc.siteVisits.submitInspectionLog.useMutation({
    onSuccess: async () => {
      toast({
        title: "Inspection Log Finalized",
        description: "Field observations and classified images have been uploaded successfully.",
      });

      // Invalidate queries
      await utils.stages.getMyStages.invalidate();
      await utils.projects.getById.invalidate({ id: projectId });
      await utils.siteVisits.getInspectionDataByProject.invalidate({ projectId });

      setShowConfirm(false);
      onOpenChange(false);
      
      // Reset form states
      setFieldNotes("");
      setSlots({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });

      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to finalize site inspection log.",
        variant: "destructive",
      });
      setShowConfirm(false);
    },
  });

  // Client-side image compression down to max 1200px
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Quality 0.8 JPEG
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSlotClick = (slotId: number) => {
    setActiveSlotId(slotId);
    // Trigger hidden file input click
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.click();
      }
    }, 50);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeSlotId === null) return;

    setCompressing(true);
    try {
      const base64Data = await compressImage(file);
      const label = slotConfigs.find((c) => c.id === activeSlotId)?.label || "Evidence";
      
      setSlots((prev) => ({
        ...prev,
        [activeSlotId]: {
          url: base64Data,
          type: label,
          capturedAt: new Date().toISOString(),
        },
      }));
    } catch (err) {
      console.error("Compression error:", err);
      toast({
        title: "Image compression failed",
        description: "Please try uploading a different photo.",
        variant: "destructive",
      });
    } finally {
      setCompressing(false);
      setActiveSlotId(null);
    }
  };

  const removeSlotPhoto = (slotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlots((prev) => ({
      ...prev,
      [slotId]: null,
    }));
  };

  const isNotesValid = fieldNotes.trim().length > 0;
  const isImagesValid = !!slots[1] && !!slots[2] && !!slots[3] && !!slots[4];
  const isValid = isNotesValid && isImagesValid;

  const handleSubmitClick = () => {
    if (!isValid) return;
    setShowConfirm(true);
  };

  const handleFinalSubmit = () => {
    // Aggregate images
    const activeImages = Object.values(slots).filter((val): val is UploadedSlot => val !== null);
    
    submitMutation.mutate({
      projectId,
      visitDate,
      fieldNotes,
      images: activeImages,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="bg-ddt-surface border border-ddt-border text-ddt-text max-w-lg w-[95%] sm:w-full rounded-2xl h-[90vh] overflow-y-auto flex flex-col justify-between p-6">
          <div className="space-y-6">
            <DialogHeader className="text-left">
              <DialogTitle className="font-syne text-lg font-bold text-ddt-accent uppercase tracking-wide flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <span>Site Inspection Workflow</span>
              </DialogTitle>
              <DialogDescription className="text-ddt-muted text-xs">
                Log observations and upload required structural photos for project **{projectCode}** ({clientName}).
              </DialogDescription>
            </DialogHeader>

            {/* Instruction Banner (Toast-like alerting callout) */}
            {instructionNote && (
              <div className="bg-[#10203A] border border-[#1E2F5A] text-ddt-text rounded-xl p-4 flex gap-3 animate-in slide-in-from-top-4 duration-300">
                <FileText className="w-5 h-5 text-ddt-accent shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-ddt-accent">
                    Manager Reminders & Instructions:
                  </span>
                  <p className="text-xs text-ddt-muted leading-relaxed font-medium italic">
                    "{instructionNote}"
                  </p>
                </div>
              </div>
            )}

            {/* Field Notes (Compulsory) */}
            <div className="space-y-2">
              <Label htmlFor="field-notes" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider flex items-center justify-between">
                <span>Technical Field Observations *</span>
                {!isNotesValid && (
                  <span className="text-[10px] text-red-400 normal-case font-medium">Notes are mandatory</span>
                )}
              </Label>
              <textarea
                id="field-notes"
                rows={4}
                value={fieldNotes}
                onChange={(e) => setFieldNotes(e.target.value)}
                placeholder="Enter comprehensive technical details regarding structural observations, deviations, and test metrics gathered during site presence."
                className="w-full bg-ddt-input border border-ddt-border focus:border-ddt-accent focus:ring-1 focus:ring-ddt-accent rounded-md py-2.5 px-3 text-sm text-ddt-text placeholder:text-ddt-faint focus:outline-none resize-none leading-relaxed"
                required
              />
            </div>

            {/* Media Matrix Upload Grid */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-ddt-muted uppercase tracking-wider block">
                Classified Image Grid Matrix * (Slots 1–4 Mandatory)
              </Label>

              <div className="grid grid-cols-2 gap-4">
                {slotConfigs.map((config) => {
                  const slotData = slots[config.id];
                  const hasPhoto = !!slotData;

                  return (
                    <div
                      key={config.id}
                      onClick={() => !compressing && handleSlotClick(config.id)}
                      className={cn(
                        "relative aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all duration-200 select-none group overflow-hidden",
                        hasPhoto
                          ? "border-emerald-500/40 bg-emerald-950/5 hover:border-emerald-500"
                          : config.required
                          ? "border-ddt-border/70 hover:border-ddt-accent/60 bg-ddt-input"
                          : "border-ddt-border/40 hover:border-ddt-border-strong bg-ddt-input/50"
                      )}
                    >
                      {hasPhoto ? (
                        <>
                          {/* Thumbnail preview */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={slotData.url}
                            alt={config.label}
                            className="absolute inset-0 w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] text-white font-mono bg-black/60 px-2 py-1 rounded">
                              Change Photo
                            </span>
                          </div>
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={(e) => removeSlotPhoto(config.id, e)}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/70 border border-ddt-border rounded-full text-ddt-text hover:text-red-400 focus:outline-none shadow z-10"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-1.5">
                          <Camera className={cn("w-5 h-5", config.required ? "text-ddt-accent/60" : "text-ddt-faint")} />
                          <span className="text-xs font-bold text-ddt-text leading-none">{config.label}</span>
                          <span className="text-[8px] text-ddt-faint leading-normal px-2 block line-clamp-2">
                            {config.helper}
                          </span>
                          <span
                            className={cn(
                              "text-[8px] uppercase tracking-widest font-mono font-bold leading-none px-1 rounded-sm mt-1 border",
                              config.required
                                ? "bg-ddt-accent-bg border-ddt-accent/20 text-ddt-accent"
                                : "bg-ddt-raised border-ddt-border text-ddt-muted"
                            )}
                          >
                            {config.required ? "Required" : "Optional"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 pt-4 border-t border-ddt-border flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised"
              disabled={submitMutation.isPending || compressing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitClick}
              disabled={!isValid || compressing || submitMutation.isPending}
              className={cn(
                "flex-1 font-bold",
                isValid
                  ? "bg-ddt-lime text-black hover:bg-ddt-lime/90"
                  : "bg-ddt-input border border-ddt-border text-ddt-faint cursor-not-allowed"
              )}
            >
              {compressing ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resizing...</span>
                </span>
              ) : (
                <span>Submit Inspection Log</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for capturing photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Submission Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-ddt-surface border border-ddt-border text-ddt-text max-w-sm w-[90%] rounded-xl p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="font-syne text-md font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Submit Inspection Log?</span>
            </DialogTitle>
            <DialogDescription className="text-ddt-muted text-xs leading-relaxed mt-2">
              This will lock the inspection entry, flag the project status as completed, and transmit full compliance data back to the office dashboard. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex flex-col gap-2 pt-2 sm:flex-col sm:space-x-0">
            <Button
              type="button"
              onClick={handleFinalSubmit}
              disabled={submitMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-black font-bold w-full"
            >
              {submitMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Submitting compliance...</span>
                </span>
              ) : (
                <span>Finalize Log & Mark Site Completed</span>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowConfirm(false)}
              className="text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised w-full"
              disabled={submitMutation.isPending}
            >
              Go Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
