"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { NdtCode } from "@/components/ui/NdtCode";
import { StatusChip } from "@/components/ui/StatusChip";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setRole(user.app_metadata.role as string);
        const { data } = await supabase.from("users").select("full_name").eq("id", user.id).single();
        if (data) setUserName(data.full_name);
      }
    }
    loadUser();
  }, []);

  const { data: projects, isLoading } = trpc.projects.list.useQuery(
    { limit: 10 },
    { enabled: !!role }
  );

  if (!role || isLoading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton type="cards" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  const isManager = role === "ops_manager" || role === "lab_owner" || role === "super_admin";

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {userName.split(" ")[0] || "User"}
        </h1>
        <p className="text-muted-foreground">
          {isManager
            ? "Here's an overview of your laboratory's active pipeline."
            : "Here are your currently assigned tasks."}
        </p>
      </div>

      {isManager ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active Projects"
              value={projects?.totalCount?.toString() || "0"}
              trend={{ direction: "up", text: "12 new" }}
            />
            <StatCard
              label="Awaiting Proofread"
              value={projects?.items?.filter((p: { status: string }) => p.status === "report_done").length.toString() || "0"}
              trend={{ direction: "up", text: "0 changed" }}
            />
            <StatCard
              label="Completed this month"
              value="24"
              trend={{ direction: "up", text: "+5 from last month" }}
            />
            <StatCard
              label="Avg. Efficiency"
              value="92%"
              trend={{ direction: "down", text: "-2% from average" }}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Recent Projects</h2>
            {projects?.items?.length === 0 ? (
              <EmptyState
                title="No active projects"
                description="Create a new project to start tracking your pipeline."
                action={
                  <button 
                    onClick={() => window.location.assign("/projects/new")}
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
                  >
                    New Project
                  </button>
                }
              />
            ) : (
              <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-medium">NDT Code</th>
                      <th className="px-4 py-3 font-medium">Client</th>
                      <th className="px-4 py-3 font-medium">Site Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {projects?.items?.map((project: { id: string; ndt_code: string; client_name: string; address: string; site_date: string; status: string }) => (
                      <tr key={project.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <NdtCode code={project.ndt_code} />
                        </td>
                        <td className="px-4 py-3 font-medium">{project.client_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(project.site_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip status={project.status as "not_started" | "wip" | "analysis_done" | "sketch_done" | "report_done" | "proof_ready" | "report_uploaded"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Your Tasks</h2>
          <EmptyState
            title="You're all caught up!"
            description="There are no tasks assigned to you right now."
          />
          {/* We'll implement Staff task query here later */}
        </div>
      )}
    </div>
  );
}
