"use client";

import { ReportCheckResult } from "@/types";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface V3ResultsPanelProps {
  results: ReportCheckResult;
}

export function V3ResultsPanel({ results }: V3ResultsPanelProps) {
  const categories = [
    { key: "boiler_plate", label: "Boilerplate & Formatting" },
    { key: "rebound_hammer", label: "Rebound Hammer Data" },
    { key: "rebar_depth", label: "Rebar Cover & Depth" },
    { key: "core_compressive", label: "Core Compressive Strength" },
    { key: "upv_testing", label: "UPV Classifications" },
    { key: "carbonation", label: "Carbonation Depth" },
    { key: "crack_measurement", label: "Crack Widths" },
    { key: "conclusion", label: "Conclusion Alignment" },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-ddt-bg p-4 rounded-xl border border-ddt-border">
        <h3 className="font-syne font-bold text-lg text-ddt-accent mb-4">V3 AI Analysis Results</h3>
        
        <div className="space-y-4">
          {categories.map(({ key, label }) => {
            const check = results[key as keyof ReportCheckResult];
            if (!check) return null;

            return (
              <div key={key} className="bg-ddt-surface p-4 rounded-lg border border-ddt-border">
                <div className="flex items-center gap-3 mb-2">
                  {check.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <h4 className="font-bold text-ddt-text font-syne">{label}</h4>
                </div>
                
                {!check.passed && (
                  <div className="mt-3 pl-8 space-y-4">
                    {check.issues?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-red-400 uppercase mb-1">Issues Found:</p>
                        <ul className="list-disc list-inside text-sm text-ddt-muted space-y-1">
                          {check.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {check.suggestions?.length > 0 && (
                      <div className="bg-ddt-input p-3 rounded-md border border-ddt-border-strong">
                        <p className="text-xs font-bold text-ddt-accent uppercase mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Suggested Correction:
                        </p>
                        <ul className="list-disc list-inside text-sm text-ddt-text space-y-1">
                          {check.suggestions.map((sug, idx) => (
                            <li key={idx}>{sug}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
