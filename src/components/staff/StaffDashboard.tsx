"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { TaskCard } from "./TaskCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ClipboardList, AlertTriangle } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface StaffDashboardProps {
  userName: string;
}

export function StaffDashboard({ userName }: StaffDashboardProps) {
  const utils = trpc.useUtils();
  const isOnline = useNetworkStatus();
  const { data: assignments, isLoading, error } = trpc.stages.getMyStages.useQuery(
    undefined,
    {
      refetchInterval: isOnline ? 5000 : false,          // Auto-refresh data from server every 5 seconds
      refetchOnWindowFocus: true,     // Re-sync instantly when they open their phone screen
      refetchOnMount: true,
      networkMode: "offlineFirst",
    } as any
  );
  const supabase = createClient();

  useEffect(() => {
    // Prevent subscribing if supabase client is not properly initialized (e.g. during build/missing env)
    if (!supabase || typeof supabase.channel !== "function") return;

    const channel = supabase
      .channel("staff-dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_stage_assignments",
        },
        () => {
          utils.stages.getMyStages.invalidate();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_visits",
        },
        () => {
          utils.stages.getMyStages.invalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [utils, supabase]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-ddt-surface rounded-lg w-1/4 animate-pulse" />
          <div className="h-6 bg-ddt-surface rounded-lg w-12 animate-pulse" />
        </div>
        <LoadingSkeleton type="cards" rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/15 border border-red-500/20 rounded-xl p-6 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mb-2" />
        <h3 className="font-syne font-bold text-ddt-text mb-1">Failed to load tasks</h3>
        <p className="text-xs text-ddt-muted max-w-sm mb-4">
          {error.message || "An error occurred while loading your tasks."}
        </p>
        <button
          onClick={() => utils.stages.getMyStages.invalidate()}
          className="px-4 py-2 bg-ddt-raised hover:bg-ddt-border text-ddt-text text-xs font-semibold rounded-md border border-ddt-border transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const activeTasks = assignments || [];
  const taskCount = activeTasks.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-ddt-surface border border-ddt-border rounded-xl p-6">
        <div>
          <h1 className="text-2xl font-bold font-syne text-ddt-text">
            Welcome back, <span className="text-ddt-accent">{userName}</span>
          </h1>
          <p className="text-xs text-ddt-muted mt-1 leading-relaxed">
            Here are the laboratory testing and report generation tasks currently assigned to you.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-ddt-input border border-ddt-border rounded-lg px-4 py-3 shrink-0">
          <ClipboardList className="w-5 h-5 text-ddt-accent" />
          <div>
            <span className="text-[10px] text-ddt-muted uppercase tracking-wider font-mono block">
              Active Tasks
            </span>
            <span className="text-lg font-bold text-ddt-text font-mono">
              {taskCount} {taskCount === 1 ? "Task" : "Tasks"}
            </span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div>
        <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-ddt-muted mb-4 flex items-center gap-2">
          <span>My Tasks</span>
          {taskCount > 0 && (
            <span className="bg-ddt-accent text-black font-bold font-mono px-2 py-0.5 rounded text-xs">
              {taskCount}
            </span>
          )}
        </h2>

        {taskCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center rounded-[24px] border border-ddt-border bg-ddt-surface relative overflow-hidden">
            {/* Connection Banner */}
            <div className="w-full max-w-sm bg-[#0D1F3C] text-[#60A5FA] border border-[#1E3A5F] rounded-full py-2.5 px-4 mb-8 text-sm font-semibold flex items-center justify-center gap-2 animate-pulse select-none">
              <span className="w-2 h-2 bg-[#60A5FA] rounded-full animate-ping" />
              <span>🕒 System Status: Active & Connected</span>
            </div>

            <h3 className="text-xl font-bold font-syne mb-2 text-ddt-text uppercase tracking-wide">
              Awaiting Orders
            </h3>
            
            <p className="text-ddt-muted text-sm max-w-md mb-2 leading-relaxed font-sans">
              You don&apos;t have any pending or in-progress tasks assigned to your profile. The local application is securely synchronized with the central laboratory command tower and will trigger real-time push alerts as soon as an inspection sequence is routed to your ID.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTasks.map((task: any) => (
              <TaskCard key={task.id} assignment={task as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
