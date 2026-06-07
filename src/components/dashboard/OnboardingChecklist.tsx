"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Users,
  Rocket,
  SearchCode,
  CheckCircle2,
  Download,
  Loader2,
  CalendarDays,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function OnboardingChecklist() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // tRPC state checks
  const { data: statusData, isLoading: loadingStatus } = trpc.projects.getOnboardingStatus.useQuery(
    undefined,
    {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchInterval: 30000,
    }
  );
  const { data: subscription, isLoading: loadingSub } = trpc.settings.getSubscription.useQuery();

  const now = new Date();
  const day = now.getDate();
  const currentQuery = { month: now.getMonth() + 1, year: now.getFullYear() };

  // Milestone 4 query (only enabled if within the day range 25-31)
  const isMilestone4Visible = day >= 25 && day <= 31;
  const { data: performanceData } = trpc.performance.monthly.useQuery(currentQuery, {
    enabled: isMilestone4Visible,
  });

  // Loading/Mount Check
  if (loadingStatus || loadingSub) {
    return null; // Smooth unmount during loading to prevent layout shifts
  }

  const isMilestone1Complete = (statusData?.staffCount ?? 0) > 0;
  const isMilestone2Complete = (statusData?.projectCount ?? 0) > 0;
  const isMilestone3Complete = (statusData?.proofReviewCount ?? 0) > 0;

  // Unmount Checklist Widget when Milestones 1, 2, and 3 are 100% complete and Milestone 4 window is inactive
  if (isMilestone1Complete && isMilestone2Complete && isMilestone3Complete && !isMilestone4Visible) {
    return null;
  }

  // Paywall Logic
  const workspaceAgeDays = 14 - (subscription?.daysRemaining ?? 14);
  const isPaywallVariant =
    subscription?.status !== "active" &&
    (subscription?.status === "inactive" || workspaceAgeDays >= 12);

  // PDF Download Trigger
  const handleExportPdf = async () => {
    if (!performanceData || performanceData.length === 0) {
      toast({
        title: "No Data Available",
        description: "There is no performance record to export for this month.",
        variant: "destructive",
      });
      return;
    }
    setIsExporting(true);
    try {
      const res = await fetch("/api/reports/performance-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: performanceData,
          month: currentQuery.month,
          year: currentQuery.year,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `performance-report-${currentQuery.year}-${currentQuery.month}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report generated",
        description: "Your PDF has been downloaded successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md p-6 relative overflow-hidden transition-all duration-300">
      {/* Top decorative gradient border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/20 via-amber-500 to-amber-500/20" />

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-amber-400">
            Workspace Onboarding Checklist
          </h2>
          <p className="text-xs text-ddt-muted mt-1">
            Complete the milestones below to fully configure your digital NDT laboratory workspace.
          </p>
        </div>

        {/* Responsive Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* MILESTONE 1: Onboard Field Personnel */}
          <div
            className={cn(
              "flex flex-col justify-between p-4 border rounded-xl min-h-[160px] transition-all duration-200",
              isMilestone1Complete
                ? "bg-emerald-950/5 border-emerald-500/20"
                : "bg-ddt-input/40 border-ddt-border hover:border-ddt-border hover:bg-ddt-input/80"
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "p-1.5 rounded-lg border",
                    isMilestone1Complete
                      ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-400"
                      : "bg-ddt-raised border-ddt-border text-ddt-muted"
                  )}
                >
                  <Users className="w-4 h-4" />
                </div>
                {isMilestone1Complete && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active Team Ready</span>
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-syne font-bold text-ddt-text text-sm">Onboard Field Personnel</h3>
                <p className="text-[11px] text-ddt-muted leading-relaxed mt-1">
                  Invite your engineering and field testing technicians to unlock real-time stage allocation and task dispatching.
                </p>
              </div>
            </div>
            {!isMilestone1Complete && (
              <div className="pt-3">
                <Link
                  href="/settings/team"
                  className="inline-flex items-center justify-center bg-ddt-raised hover:bg-ddt-border border border-ddt-border hover:border-ddt-accent text-ddt-text hover:text-ddt-accent text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                >
                  Invite Team →
                </Link>
              </div>
            )}
          </div>

          {/* MILESTONE 2: Launch First Project */}
          <div
            className={cn(
              "flex flex-col justify-between p-4 border rounded-xl min-h-[160px] transition-all duration-200",
              isMilestone2Complete
                ? "bg-emerald-950/5 border-emerald-500/20"
                : "bg-ddt-input/40 border-ddt-border hover:border-ddt-border hover:bg-ddt-input/80"
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "p-1.5 rounded-lg border",
                    isMilestone2Complete
                      ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-400"
                      : "bg-ddt-raised border-ddt-border text-ddt-muted"
                  )}
                >
                  <Rocket className="w-4 h-4" />
                </div>
                {isMilestone2Complete && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Project Created</span>
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-syne font-bold text-ddt-text text-sm">Launch First Project</h3>
                <p className="text-[11px] text-ddt-muted leading-relaxed mt-1">
                  Log your initial NDT structural inspection profile to track laboratory diagnostics across the pipeline.
                </p>
              </div>
            </div>
            {!isMilestone2Complete && (
              <div className="pt-3">
                <Link
                  href="/projects/new"
                  className="inline-flex items-center justify-center bg-ddt-raised hover:bg-ddt-border border border-ddt-border hover:border-ddt-accent text-ddt-text hover:text-ddt-accent text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                >
                  Create Project →
                </Link>
              </div>
            )}
          </div>

          {/* MILESTONE 3: Run AI Report Proofing OR Paywall Variant */}
          {isPaywallVariant ? (
            /* PAYWALL VARIANT */
            <div className="flex flex-col justify-between p-4 border border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 rounded-xl min-h-[160px] transition-all duration-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-semibold">
                    Upgrade Gated
                  </span>
                </div>
                <div>
                  <h3 className="font-syne font-bold text-ddt-text text-sm flex items-center gap-1.5">
                    Unlock Automated Compliance
                  </h3>
                  <p className="text-[11px] text-ddt-muted leading-relaxed mt-1">
                    Your trial is nearing its limit. Upgrade your subscription tier to continue utilizing automated AI structural proofreading.
                  </p>
                </div>
              </div>
              <div className="pt-3">
                <Link
                  href="/settings/subscription"
                  className="inline-flex items-center justify-center bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm"
                >
                  Upgrade to Premium
                </Link>
              </div>
            </div>
          ) : (
            /* STANDARD MILESTONE 3 */
            <div
              className={cn(
                "flex flex-col justify-between p-4 border rounded-xl min-h-[160px] transition-all duration-200",
                isMilestone3Complete
                  ? "bg-emerald-950/5 border-emerald-500/20"
                  : "bg-ddt-input/40 border-ddt-border hover:border-ddt-border hover:bg-ddt-input/80"
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg border",
                      isMilestone3Complete
                        ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-400"
                        : "bg-ddt-raised border-ddt-border text-ddt-muted"
                    )}
                  >
                    <SearchCode className="w-4 h-4" />
                  </div>
                  {isMilestone3Complete && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>AI Proofed</span>
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-syne font-bold text-ddt-text text-sm">Run AI Report Proofing</h3>
                  <p className="text-[11px] text-ddt-muted leading-relaxed mt-1">
                    Process a structural validation report through the compliance engine to cross-examine technical data anomalies.
                  </p>
                </div>
              </div>
              {!isMilestone3Complete && (
                <div className="pt-3">
                  <Link
                    href="/projects"
                    className="inline-flex items-center justify-center bg-ddt-raised hover:bg-ddt-border border border-ddt-border hover:border-ddt-accent text-ddt-text hover:text-ddt-accent text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  >
                    Analyze Report →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* MILESTONE 4: Export Performance Analytics (Time Gated) */}
          {isMilestone4Visible && (
            <div className="flex flex-col justify-between p-4 border border-ddt-border bg-ddt-input/40 hover:border-ddt-border hover:bg-ddt-input/80 rounded-xl min-h-[160px] transition-all duration-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-ddt-raised border border-ddt-border text-ddt-muted">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-ddt-accent bg-ddt-accent/10 px-2 py-0.5 rounded-full font-semibold">
                    Month-End
                  </span>
                </div>
                <div>
                  <h3 className="font-syne font-bold text-ddt-text text-sm">Export Performance Analytics</h3>
                  <p className="text-[11px] text-ddt-muted leading-relaxed mt-1">
                    The month-end performance period is complete. Review and export your laboratory staff utilization and report turnaround metrics.
                  </p>
                </div>
              </div>
              <div className="pt-3">
                <button
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="inline-flex items-center justify-center bg-ddt-raised hover:bg-ddt-border border border-ddt-border hover:border-ddt-accent text-ddt-text hover:text-ddt-accent text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 gap-1.5"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" />
                      <span>Download Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
