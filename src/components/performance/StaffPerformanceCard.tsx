"use client";

import { useState } from "react";
import { ScoreGauge } from "./ScoreGauge";
import { AvatarCircle } from "../ui/AvatarCircle";
import { 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Activity, 
  Clock, 
  AlertTriangle,
  Layers,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { NdtCode } from "../ui/NdtCode";
import { Separator } from "../ui/separator";

interface StageDetail {
  id: string;
  project_id: string;
  ndt_code: string;
  stage: string;
  started_at: string | null;
  completed_at: string;
  durationHours: number;
}

interface SiteVisitDetail {
  id: string;
  project_id: string;
  ndt_code: string;
  client_name: string;
  visit_date: string;
  number_of_floors: number | null;
}

interface FaultDetail {
  id: string;
  project_id: string;
  ndt_code: string;
  failure_reason: string | null;
  reviewed_at: string;
}

interface StaffPerformanceCardProps {
  report: {
    user: {
      id: string;
      full_name: string;
      role: string;
    };
    stats: {
      stagesCompleted: number;
      stagesBreakdown: {
        analysis: number;
        sketch: number;
        report_writing: number;
        proofreading: number;
      };
      avgCompletionHours: number;
      faultCount: number;
      siteVisitsCount: number;
      efficiencyScore: number;
    };
    stageDetails: StageDetail[];
    siteVisitDetails: SiteVisitDetail[];
    faultDetails: FaultDetail[];
  };
}

export function StaffPerformanceCard({ report }: StaffPerformanceCardProps) {
  const { user, stats, stageDetails, siteVisitDetails, faultDetails } = report;
  const [isOpen, setIsOpen] = useState(false);
  
  const isManager = user.role === "ops_manager" || user.role === "lab_owner" || user.role === "super_admin";

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const getStageLabel = (stage: string) => {
    return stage.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-5 hover:border-ddt-accent/30 transition-all duration-300">
      {/* Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <AvatarCircle initials={user.full_name?.substring(0, 2).toUpperCase() || "??"} size="md" />
          <div>
            <h3 className="font-semibold text-lg text-foreground tracking-tight">{user.full_name}</h3>
            <span className="inline-flex items-center text-xs text-muted-foreground mt-0.5 font-medium">
              {isManager && <Shield className="w-3 h-3 mr-1 text-ddt-accent" />}
              {user.role === "ops_manager" ? "Ops Manager" : user.role === "staff" ? "Staff" : user.role === "lab_owner" ? "Lab Owner" : "Admin"}
            </span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <ScoreGauge score={stats.efficiencyScore} />
          <span className="text-xs text-muted-foreground mt-1 font-medium">Efficiency</span>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-border/60 bg-muted/20 rounded-md px-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Site Visits</p>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-xl text-foreground">{stats.siteVisitsCount}</span>
            <span className="text-[10px] text-muted-foreground font-semibold">visits</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Total Stages</p>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-xl text-foreground">{stats.stagesCompleted}</span>
            <span className="text-[10px] text-muted-foreground font-semibold">stages</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Avg. Speed</p>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-xl text-foreground">
              {stats.avgCompletionHours > 0 ? stats.avgCompletionHours.toFixed(1) : "—"}
            </span>
            {stats.avgCompletionHours > 0 && <span className="text-[10px] text-muted-foreground font-semibold">hrs</span>}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Quality</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {stats.faultCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                {stats.faultCount} FAULT{stats.faultCount > 1 ? "S" : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                0 FAULTS
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stage Breakdown Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage Breakdown</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/30 border border-border/40 rounded p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Analysis</span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">{stats.stagesBreakdown.analysis}</span>
          </div>
          <div className="bg-muted/30 border border-border/40 rounded p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Sketch</span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">{stats.stagesBreakdown.sketch}</span>
          </div>
          <div className="bg-muted/30 border border-border/40 rounded p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Reports</span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">{stats.stagesBreakdown.report_writing}</span>
          </div>
        </div>
      </div>

      {/* Details Button with Dialog */}
      <div className="flex justify-end pt-1">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto text-xs border-border text-foreground hover:bg-secondary">
              View Details
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-ddt-bg border-border text-foreground">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                <AvatarCircle initials={user.full_name?.substring(0, 2).toUpperCase() || "??"} size="sm" />
                <div>
                  <span>{user.full_name}</span>
                  <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                    Detailed Performance Breakdown &middot; Score: <span className="font-bold text-ddt-accent">{stats.efficiencyScore}</span>
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>

            <Separator className="bg-border/60" />

            <div className="space-y-8 mt-4">
              {/* Site Visits Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <MapPin className="w-4 h-4 text-ddt-accent" />
                  Site Attendance ({siteVisitDetails.length})
                </h3>
                {siteVisitDetails.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pl-6">No site visits recorded in this period.</p>
                ) : (
                  <div className="border border-border/60 rounded-lg overflow-hidden bg-muted/10">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border/60 text-muted-foreground font-semibold">
                          <th className="p-3">Visit Date</th>
                          <th className="p-3">NDT Code</th>
                          <th className="p-3">Client</th>
                          <th className="p-3 text-right">Floors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {siteVisitDetails.map((visit) => (
                          <tr key={visit.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-medium">{formatDate(visit.visit_date)}</td>
                            <td className="p-3"><NdtCode code={visit.ndt_code} /></td>
                            <td className="p-3 text-muted-foreground truncate max-w-[200px]">{visit.client_name}</td>
                            <td className="p-3 text-right font-medium">{visit.number_of_floors ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Report Stages Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <Layers className="w-4 h-4 text-ddt-accent" />
                  Completed Workflow Stages ({stageDetails.length})
                </h3>
                {stageDetails.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pl-6">No completed stages in this period.</p>
                ) : (
                  <div className="border border-border/60 rounded-lg overflow-hidden bg-muted/10">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border/60 text-muted-foreground font-semibold">
                          <th className="p-3">Completed Date</th>
                          <th className="p-3">NDT Code</th>
                          <th className="p-3">Stage</th>
                          <th className="p-3 text-right">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {stageDetails.map((stage) => (
                          <tr key={stage.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-medium">{formatDate(stage.completed_at)}</td>
                            <td className="p-3"><NdtCode code={stage.ndt_code} /></td>
                            <td className="p-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-muted/50 text-foreground border border-border/60">
                                {getStageLabel(stage.stage)}
                              </span>
                            </td>
                            <td className="p-3 text-right font-semibold text-foreground">
                              {stage.durationHours > 0 ? `${stage.durationHours.toFixed(1)}h` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Proof Reviews Faults Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Proofread Faults ({faultDetails.length})
                </h3>
                {faultDetails.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg pl-4 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Flawless month! No faults recorded for this team member.</span>
                  </div>
                ) : (
                  <div className="border border-border/60 rounded-lg overflow-hidden bg-muted/10">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border/60 text-muted-foreground font-semibold">
                          <th className="p-3">Review Date</th>
                          <th className="p-3">NDT Code</th>
                          <th className="p-3">Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {faultDetails.map((fault) => (
                          <tr key={fault.id} className="hover:bg-red-500/5 transition-colors">
                            <td className="p-3 font-medium">{formatDate(fault.reviewed_at)}</td>
                            <td className="p-3"><NdtCode code={fault.ndt_code} /></td>
                            <td className="p-3 text-red-300 font-medium">{fault.failure_reason ?? "No reason specified."}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
