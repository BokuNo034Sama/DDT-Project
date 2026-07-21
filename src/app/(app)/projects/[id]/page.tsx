"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { PipelineBar } from "@/components/projects/PipelineBar";
import { SiteVisitsList } from "@/components/projects/SiteVisitsList";
import { StatusHistory } from "@/components/projects/StatusHistory";
import { SiteInspectionsReel } from "@/components/projects/SiteInspectionsReel";
import { TopBar } from "@/components/layout/TopBar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const isOnline = useNetworkStatus();
  
  const { data: me } = trpc.staff.getMe.useQuery();
  const role = me?.role;
  const isManager = role === "ops_manager" || role === "lab_owner" || role === "super_admin";
  const { data: subscription } = trpc.settings.getSubscription.useQuery();
  const { data: project, isLoading, error } = trpc.projects.getById.useQuery(
    { id },
    {
      refetchInterval: isOnline ? 5000 : false,
      refetchOnWindowFocus: true,
      networkMode: "offlineFirst",
    } as any
  );

  const title = isLoading ? "Loading Project..." : project?.client_name;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <TopBar title={title} />
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <TopBar title="Project Not Found" />
        <EmptyState
          title="Project Not Found"
          description="The project you are looking for does not exist or you don't have permission to view it."
          action={
            <button
              onClick={() => window.location.assign("/projects")}
              className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              Back to Projects
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4 animate-in fade-in duration-500">
      <TopBar title={title} />
      
      {/* Back to Projects */}
      <div className="flex items-center">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ddt-muted hover:text-ddt-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Project Details Specs Header */}
      <ProjectHeader project={project} />

      {/* Pipeline visualization & assignments & proof logs */}
      <PipelineBar
        project={project}
        stages={project.project_stage_assignments || []}
        userRole={role || "staff"}
        plan={(subscription?.plan as "free" | "starter" | "pro") ?? "free"}
      />

      {/* Site Visits Log */}
      <SiteVisitsList project={project} />

      {/* Site Inspections Reel */}
      <SiteInspectionsReel projectId={project.id} />

      {/* Status History */}
      <StatusHistory project={project} />
    </div>
  );
}
