"use client";

import { useState } from "react";
import { History, ChevronDown, ChevronUp, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusHistoryProps {
  project: any;
}

export function StatusHistory({ project }: StatusHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const history = project.status_history || [];

  if (history.length === 0) return null;

  // Order history by date descending (latest changes first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  const displayedHistory = isExpanded ? sortedHistory : sortedHistory.slice(0, 3);
  const hasMore = sortedHistory.length > 3;

  const formatStatusText = (statusStr: string | null) => {
    if (!statusStr) return "None";
    return statusStr.replace(/_/g, " ").toUpperCase();
  };

  const getStatusColor = (statusStr: string | null) => {
    if (!statusStr) return "text-ddt-faint";
    switch (statusStr) {
      case "not_started":
        return "text-ddt-muted";
      case "wip":
        return "text-blue-400";
      case "analysis_done":
        return "text-teal-400";
      case "sketch_done":
        return "text-purple-400";
      case "report_done":
        return "text-sky-400";
      case "proof_ready":
        return "text-orange-400";
      case "report_uploaded":
        return "text-indigo-400";
      case "report_verified":
      case "report_delivered":
        return "text-emerald-400";
      case "proof_failed":
        return "text-red-400";
      default:
        return "text-ddt-text";
    }
  };

  return (
    <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-ddt-muted flex items-center gap-2">
          <History className="w-4 h-4 text-ddt-accent" />
          <span>Status Transition History</span>
        </h2>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-ddt-accent hover:underline focus:outline-none"
          >
            <span>{isExpanded ? "Show Less" : `Show All (${sortedHistory.length})`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      <div className="relative pl-4 border-l-2 border-ddt-border/50 ml-2 space-y-6">
        {displayedHistory.map((log: any, index) => {
          const changerName = log.changed_by_user?.full_name || "System";
          const formattedDate = new Date(log.changed_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={log.id} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-ddt-surface border-2 border-ddt-accent transition-all duration-300 group-hover:bg-ddt-accent group-hover:scale-110" />

              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  {/* Transition Info */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {log.from_status ? (
                      <>
                        <span className={cn("font-mono font-semibold", getStatusColor(log.from_status))}>
                          {formatStatusText(log.from_status)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-ddt-faint shrink-0" />
                      </>
                    ) : (
                      <span className="text-ddt-faint italic font-mono mr-1">Initialized</span>
                    )}
                    <span className={cn("font-mono font-bold", getStatusColor(log.to_status))}>
                      {formatStatusText(log.to_status)}
                    </span>
                    <span className="text-ddt-muted font-sans font-medium pl-1">
                      by {changerName}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 text-[10px] text-ddt-faint font-mono shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{formattedDate}</span>
                  </div>
                </div>

                {/* Audit notes if present */}
                {log.notes && (
                  <p className="text-xs text-ddt-muted font-sans italic bg-ddt-input/20 border border-ddt-border/30 px-3 py-1.5 rounded leading-relaxed">
                    "{log.notes}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
