"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { UserPill } from "@/components/ui/UserPill";
import { Loader2, Camera, Calendar, Clipboard, X, ZoomIn } from "lucide-react";

interface SiteInspectionsReelProps {
  projectId: string;
}

export function SiteInspectionsReel({ projectId }: SiteInspectionsReelProps) {
  const { data: logs, isLoading, error } = trpc.siteVisits.getInspectionDataByProject.useQuery({
    projectId,
  });

  const [activeImage, setActiveImage] = useState<{ url: string; type: string } | null>(null);

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 shadow-md animate-pulse"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-ddt-accent mb-2" />
        <span className="text-xs text-ddt-muted">Retrieving site inspection records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="text-center shadow-md"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <p className="text-sm text-red-400">Failed to load inspection data: {error.message}</p>
      </div>
    );
  }

  const completedLogs = logs?.filter((l) => l.status === "completed") || [];

  if (completedLogs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center border border-dashed shadow-md"
        style={{
          background: "var(--color-bg-surface)",
          borderColor: "var(--color-border)",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <Camera className="w-10 h-10 text-ddt-faint mb-2" />
        <p className="text-sm font-syne font-bold text-ddt-text uppercase tracking-wide">No Inspections Completed</p>
        <p className="text-xs text-ddt-muted max-w-sm mt-1">
          Once the designated Team Leader completes their field report and uploads the required structural images, the closed-loop data records will compile here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {completedLogs.map((log) => {
        const teamLeadName = log.team_lead_user?.full_name || "Unknown Team Lead";
        const initials = teamLeadName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .substring(0, 2);

        // Safely parse images JSONB
        const rawImages = log.images;
        const imagesList = Array.isArray(rawImages) ? rawImages : [];

        return (
          <div
            key={log.id}
            className="shadow-md relative overflow-hidden transition-all duration-300 hover:border-ddt-border-strong"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            {/* Fixed Header Layout — Eliminates Double Name Duplicate */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                {/* UserPill renders the name automatically. We wrap it cleanly with the role header above/beside it */}
                <div>
                  <span className="text-[10px] text-blue-400 uppercase tracking-widest font-mono font-bold block mb-1">
                    Team Leader
                  </span>
                  <UserPill
                    name={teamLeadName}
                    avatarInitials={initials}
                    className="bg-slate-800 border border-slate-700 text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 w-fit">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {log.completed_at
                    ? new Date(log.completed_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            {/* Instruction Callout (if instructions were set by manager) */}
            {log.manager_instruction_note && (
              <div className="mb-4 bg-ddt-input/50 border border-ddt-border/30 rounded-lg p-3 text-xs text-ddt-muted relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-ddt-accent" />
                <span className="font-semibold text-ddt-text uppercase tracking-wider block text-[10px] mb-1 font-mono">Manager Instruction Note:</span>
                <p className="leading-relaxed italic">"{log.manager_instruction_note}"</p>
              </div>
            )}

            {/* Observations Section */}
            <div className="space-y-2 mb-6">
              <span className="text-xs font-semibold text-ddt-muted uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Clipboard className="w-3.5 h-3.5 text-ddt-accent" />
                <span>Technical Field Observations</span>
              </span>
              <div className="bg-ddt-input/30 border border-ddt-border rounded-lg p-4 text-sm text-ddt-text leading-relaxed whitespace-pre-wrap font-sans">
                {log.field_notes}
              </div>
            </div>

            {/* Images Matrix Grid */}
            {imagesList.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-ddt-muted uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Camera className="w-3.5 h-3.5 text-ddt-accent" />
                  <span>Classified Site Imagery</span>
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {imagesList.map((img: any, idx: number) => {
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveImage({ url: img.url, type: img.type })}
                        className="group relative aspect-[4/3] rounded-lg border border-ddt-border/50 bg-ddt-input overflow-hidden cursor-pointer hover:border-ddt-accent transition-all duration-300"
                      >
                        {/* Image element */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.type}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        
                        {/* Type Badge Overlay */}
                        <div className="absolute top-2 left-2 bg-black/75 border border-ddt-accent/20 text-ddt-accent text-[9px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded shadow">
                          {img.type}
                        </div>

                        {/* Hover Overlay Zoom Indicator */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-black/60 border border-ddt-accent text-ddt-accent p-2 rounded-full shadow-lg">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Lightbox Image Overlay Viewer */}
      {activeImage && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300"
          onClick={() => setActiveImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-4 right-4 bg-black/60 border border-ddt-border text-ddt-text hover:text-ddt-accent p-2 rounded-full focus:outline-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Lightbox Media */}
          <div
            className="relative max-w-4xl max-h-[80vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.url}
              alt={activeImage.type}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-ddt-border/30"
            />

            {/* Badge */}
            <div className="absolute bottom-4 left-4 bg-black/85 border border-ddt-accent text-ddt-accent text-xs font-bold font-mono uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg">
              {activeImage.type}
            </div>
          </div>
          <span className="text-ddt-muted text-xs font-mono mt-4 select-none">Click anywhere outside to close</span>
        </div>
      )}
    </div>
  );
}
