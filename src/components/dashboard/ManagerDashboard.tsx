"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/ui/StatCard";
import { NdtCode } from "@/components/ui/NdtCode";
import { StatusChip } from "@/components/ui/StatusChip";
import { UserPill } from "@/components/ui/UserPill";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  AlertCircle,
  Users,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface ManagerDashboardProps {
  userName: string;
}

export function ManagerDashboard({ userName }: ManagerDashboardProps) {
  useEffect(() => {
    console.log("ManagerDashboard mounted for user:", userName);
  }, [userName]);

  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.projects.getDashboardData.useQuery();

  console.log("ManagerDashboard render state:", { isLoading, error, hasData: !!data });

  const supabase = createClient();

  useEffect(() => {
    if (!supabase || typeof supabase.channel !== "function") return;

    const channel = supabase
      .channel("manager-dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => utils.projects.getDashboardData.invalidate()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [utils, supabase]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <LoadingSkeleton type="cards" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/15 border border-red-500/20 rounded-xl p-6 flex flex-col items-center text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
        <h3 className="font-syne font-bold text-ddt-text mb-1">Failed to load dashboard</h3>
        <p className="text-xs text-ddt-muted max-w-sm">{error.message}</p>
      </div>
    );
  }

  const stats = data?.stats;
  const recentProjects = data?.recentProjects ?? [];
  const activeAssignments = data?.activeAssignments ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="bg-ddt-surface border border-ddt-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ddt-accent/20 via-ddt-accent to-ddt-accent/20" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-syne text-ddt-text">
              Welcome back, <span className="text-ddt-accent">{userName}</span>
            </h1>
            <p className="text-xs text-ddt-muted mt-1">
              Here&apos;s an overview of your laboratory&apos;s active pipeline and team performance.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-ddt-muted bg-ddt-input border border-ddt-border rounded-lg px-3 py-2 shrink-0">
            <TrendingUp className="w-4 h-4 text-ddt-accent" />
            <span>Live dashboard</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Active Projects"
          value={stats?.activeCount?.toString() ?? "0"}
          trend={{ direction: "up", text: "In pipeline" }}
        />
        <StatCard
          label="Awaiting Proofread"
          value={stats?.awaitingProofread?.toString() ?? "0"}
          trend={{
            direction: (stats?.awaitingProofread ?? 0) > 0 ? "up" : "down",
            text: "Needs review",
          }}
        />
        <StatCard
          label="Completed This Month"
          value={stats?.completedThisMonth?.toString() ?? "0"}
          trend={{ direction: "down", text: "Delivered" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects Table */}
        <div className="lg:col-span-2 bg-ddt-surface border border-ddt-border rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-ddt-border flex items-center justify-between">
            <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-ddt-muted">
              Recent Projects
            </h2>
            <Link
              href="/projects"
              className="text-xs text-ddt-accent hover:underline flex items-center gap-1"
            >
              View all <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No active projects"
                description="Create a new project to start tracking your pipeline."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ddt-raised/50 text-ddt-muted border-b border-ddt-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">NDT Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Site Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ddt-border/50">
                  {recentProjects.map((project: any) => (
                    <tr
                      key={project.id}
                      className="hover:bg-ddt-raised/30 transition-colors cursor-pointer"
                      onClick={() => window.location.assign(`/projects/${project.id}`)}
                    >
                      <td className="px-4 py-3">
                        <NdtCode code={project.ndt_code} />
                      </td>
                      <td className="px-4 py-3 font-medium text-ddt-text max-w-[180px] truncate">
                        {project.client_name}
                      </td>
                      <td className="px-4 py-3 text-ddt-muted font-mono text-xs hidden md:table-cell">
                        {new Date(project.site_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip status={project.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active Staff Panel */}
        <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-ddt-border flex items-center gap-2">
            <Users className="w-4 h-4 text-ddt-accent" />
            <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-ddt-muted">
              Active Staff
            </h2>
          </div>

          <div className="p-4 space-y-3">
            {activeAssignments.length === 0 ? (
              <p className="text-xs text-ddt-faint italic text-center py-4">
                No staff currently working on tasks
              </p>
            ) : (
              activeAssignments.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-start gap-3 p-3 bg-ddt-input border border-ddt-border/50 rounded-lg hover:border-ddt-border transition-all"
                >
                  <UserPill
                    name={assignment.assigned_user?.full_name ?? "Unknown"}
                    avatarInitials={(assignment.assigned_user?.full_name ?? "?")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .substring(0, 2)}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-ddt-text truncate">
                      {assignment.assigned_user?.full_name ?? "Unknown"}
                    </p>
                    <p className="text-[10px] text-ddt-muted font-mono mt-0.5 truncate">
                      {assignment.stage?.replace("_", " ")} — {assignment.project?.ndt_code ?? "—"}
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-ddt-accent/10 text-ddt-accent border border-ddt-accent/20">
                      In Progress
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
