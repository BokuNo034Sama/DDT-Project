"use client";

import { useState } from "react";
import { ProjectWithRelations } from "@/types";
import { LsmtlStatus } from "@/types";
import { cn } from "@/lib/utils";
import { 
  Building,
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileCheck,
  Calendar,
  X
} from "lucide-react";

interface LsmtlTrackingCardProps {
  project: ProjectWithRelations;
  onStatusUpdate: (status: LsmtlStatus) => void;
  onProjectComplete: () => void;
}

export function LsmtlTrackingCard({
  project,
  onStatusUpdate,
  onProjectComplete,
}: LsmtlTrackingCardProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmNdtCode, setConfirmNdtCode] = useState("");
  
  const ndtCode = project.ndt_code || "";
  const clientName = project.client_name || "";
  const currentLsmtlStatus = project.lsmtl_status || "pending";
  const isDelivered = project.status === "report_delivered";

  // Header chip states
  let headerChipLabel = "Awaiting LSMTL Review";
  let headerChipBg = "bg-[#10203A] text-[#818CF8] border border-[#818CF8]/20";

  if (project.status === "report_verified") {
    headerChipLabel = "LSMTL Verified";
    headerChipBg = "bg-[#0A2E1A] text-[#34D399] border border-[#34D399]/20";
  } else if (isDelivered) {
    headerChipLabel = "Project Delivered ✓";
    headerChipBg = "bg-[#062210] text-[#10B981] border border-[#10B981]/20";
  }

  // Handle button clicks
  const handleSelectStatus = (selected: Exclude<LsmtlStatus, "pending" | null>) => {
    if (isDelivered) return;

    if (selected === "report_collected") {
      setShowConfirmModal(true);
      return;
    }

    if (currentLsmtlStatus === selected) {
      // Toggle off -> reset to pending
      onStatusUpdate("pending");
    } else {
      onStatusUpdate(selected);
    }
  };

  const handleConfirmCompletion = () => {
    if (confirmNdtCode.trim() === ndtCode) {
      onStatusUpdate("report_collected");
      setShowConfirmModal(false);
      setConfirmNdtCode("");
      onProjectComplete();
    }
  };

  return (
    <div
      className="lsmtl-card shadow-xl transition-all duration-300 w-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-ddt-border/30">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-ddt-raised border border-ddt-border rounded-xl text-ddt-accent shrink-0">
            <Building className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-syne font-bold text-ddt-text text-base flex items-center gap-2">
              LSMTL Portal Status
            </h3>
            <p className="text-xs text-ddt-muted mt-0.5">
              Track the status of your uploaded report
            </p>
          </div>
        </div>
        <div className={cn("px-3 py-1 rounded-full text-xs font-bold font-sans tracking-wide self-start sm:self-center shrink-0 uppercase", headerChipBg)}>
          {headerChipLabel}
        </div>
      </div>

      {/* Body: Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Button 1: Rejected */}
        <button
          type="button"
          disabled={isDelivered}
          onClick={() => handleSelectStatus("report_rejected")}
          className={cn(
            "flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 select-none cursor-pointer w-full group",
            isDelivered && "opacity-50 cursor-not-allowed",
            currentLsmtlStatus === "report_rejected"
              ? "bg-[#2E0A0A] border-[#4A1010] text-[#F87171]"
              : "bg-ddt-input border-ddt-border/50 text-ddt-muted hover:border-red-500/30 hover:bg-ddt-raised/50"
          )}
        >
          <div className="flex items-center gap-2.5 mb-2 font-bold font-syne text-sm">
            <XCircle className={cn("w-4 h-4 shrink-0 transition-colors", currentLsmtlStatus === "report_rejected" ? "text-[#F87171]" : "text-ddt-faint group-hover:text-red-400")} />
            <span>Report Rejected</span>
          </div>
          <p className="text-xs leading-relaxed opacity-95 text-ddt-muted group-hover:text-ddt-text transition-colors">
            LSMTL has rejected this report. Download, fix the issues and re-upload.
          </p>
        </button>

        {/* Button 2: Mismatched */}
        <button
          type="button"
          disabled={isDelivered}
          onClick={() => handleSelectStatus("mismatched_report")}
          className={cn(
            "flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 select-none cursor-pointer w-full group",
            isDelivered && "opacity-50 cursor-not-allowed",
            currentLsmtlStatus === "mismatched_report"
              ? "bg-[#2A1505] border-[#4A2A10] text-[#FB923C]"
              : "bg-ddt-input border-ddt-border/50 text-ddt-muted hover:border-amber-500/30 hover:bg-ddt-raised/50"
          )}
        >
          <div className="flex items-center gap-2.5 mb-2 font-bold font-syne text-sm">
            <AlertTriangle className={cn("w-4 h-4 shrink-0 transition-colors", currentLsmtlStatus === "mismatched_report" ? "text-[#FB923C]" : "text-ddt-faint group-hover:text-amber-400")} />
            <span>Mismatched Report</span>
          </div>
          <p className="text-xs leading-relaxed opacity-95 text-ddt-muted group-hover:text-ddt-text transition-colors">
            The uploaded report does not match the registered project details. Re-check and re-upload the correct report.
          </p>
        </button>

        {/* Button 3: Collected */}
        <button
          type="button"
          disabled={isDelivered}
          onClick={() => handleSelectStatus("report_collected")}
          className={cn(
            "flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 select-none cursor-pointer w-full group",
            isDelivered
              ? "bg-[#062210] border-[#0A3A1C] text-[#10B981] opacity-100 cursor-default"
              : currentLsmtlStatus === "report_collected"
              ? "bg-[#062210] border-[#0A3A1C] text-[#10B981]"
              : "bg-ddt-input border-ddt-border/50 text-ddt-muted hover:border-emerald-500/30 hover:bg-ddt-raised/50"
          )}
        >
          <div className="flex items-center gap-2.5 mb-2 font-bold font-syne text-sm">
            <CheckCircle2 className={cn("w-4 h-4 shrink-0 transition-colors", (currentLsmtlStatus === "report_collected" || isDelivered) ? "text-[#10B981]" : "text-ddt-faint group-hover:text-emerald-400")} />
            <span>Report Collected</span>
          </div>
          <p className="text-xs leading-relaxed opacity-95 text-ddt-muted group-hover:text-ddt-text transition-colors">
            {isDelivered 
              ? "The report was verified and collected. Project is fully complete."
              : "The report has been verified and collected from the LSMTL portal. Click to complete this project."
            }
          </p>
        </button>
      </div>

      {/* Info messages under buttons */}
      {!isDelivered && currentLsmtlStatus === "report_rejected" && (
        <div className="mt-5 p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-red-200 leading-relaxed">
            <strong>Action Needed:</strong> Download the report, fix the issues flagged by LSMTL, and re-upload to the portal. When ready, use the Proofread Bot to re-verify before re-uploading.
          </p>
        </div>
      )}

      {!isDelivered && currentLsmtlStatus === "mismatched_report" && (
        <div className="mt-5 p-3.5 bg-amber-950/20 border border-amber-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-amber-200 leading-relaxed">
            <strong>Action Needed:</strong> Check that the report file matches the project registered on the LSMTL portal. Ensure client name, address, and NDT code match exactly.
          </p>
        </div>
      )}

      {/* Footer completion date display */}
      {isDelivered && project.updated_at && (
        <div className="mt-6 pt-4 border-t border-ddt-border/30 flex items-center gap-2 text-xs text-emerald-400 font-mono">
          <Calendar className="w-4 h-4" />
          <span>
            Project complete. Delivered on:{" "}
            {new Date(project.updated_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg overflow-hidden border rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200"
            style={{
              background: "#0F172A", // Dark slate background
              borderColor: "var(--color-border)",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-ddt-border/30">
              <h4 className="font-syne font-bold text-lg text-ddt-text">
                Complete Project?
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmNdtCode("");
                }}
                className="p-1 rounded-lg text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-ddt-muted leading-relaxed">
                You are about to mark <span className="font-bold text-ddt-text font-mono">{ndtCode}</span> — <span className="font-bold text-ddt-text">{clientName}</span> as fully delivered.
              </p>

              <div className="bg-ddt-input/50 border border-ddt-border/30 p-4 rounded-xl space-y-2">
                <span className="text-xs uppercase tracking-wider text-ddt-accent font-bold block mb-1">
                  This confirms that:
                </span>
                <ul className="text-xs text-ddt-muted space-y-2 font-medium">
                  <li className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Report was uploaded to LSMTL portal</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Report was verified and approved by LSMTL</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Report has been collected from the portal</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-red-950/20 border border-red-500/10 rounded-xl">
                <p className="text-xs text-red-300 leading-normal font-semibold">
                  ⚠️ This action will mark the project as DELIVERED and cannot be undone.
                </p>
              </div>

              {/* Confirmation input */}
              <div className="space-y-2">
                <label htmlFor="ndt-code-input" className="block text-xs font-bold text-ddt-muted uppercase tracking-wider">
                  Type the NDT code to confirm:
                </label>
                <input
                  id="ndt-code-input"
                  type="text"
                  placeholder={ndtCode}
                  value={confirmNdtCode}
                  onChange={(e) => setConfirmNdtCode(e.target.value)}
                  className="w-full px-4 py-3 bg-ddt-input border border-ddt-border rounded-xl text-ddt-text font-mono font-bold placeholder:text-ddt-faint focus:outline-none focus:border-ddt-accent transition-colors"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 p-5 bg-ddt-raised/40 border-t border-ddt-border/30">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmNdtCode("");
                }}
                className="px-4 py-2 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmNdtCode.trim() !== ndtCode}
                onClick={handleConfirmCompletion}
                className={cn(
                  "px-4 py-2 font-bold text-xs rounded-xl transition-all shadow-md",
                  confirmNdtCode.trim() === ndtCode
                    ? "bg-[#A3E635] text-black hover:bg-[#A3E635]/90 cursor-pointer"
                    : "bg-[#A3E635]/30 text-black/50 cursor-not-allowed border border-[#A3E635]/10"
                )}
              >
                Complete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
