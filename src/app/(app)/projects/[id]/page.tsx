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
import { ReportBotPanel } from "@/components/v4/ReportBotPanel";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const isOnline = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<"history" | "inspections">("history");
  
  const { data: me } = trpc.staff.getMe.useQuery();
  const role = me?.role;
  const isManager = role === "ops_manager" || role === "lab_owner" || role === "super_admin";
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
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
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
      <PipelineBar project={project} />

      {/* Render ReportBotPanel when manager and status is report_done */}
      {isManager && project.status === "report_done" && (
        <div id="report-bot-panel">
          <ReportBotPanel project={project} />
        </div>
      )}

      {/* Detailed site logs and history timeline grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="md:col-span-1">
          <SiteVisitsList project={project} />
        </div>
        <div className="md:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-ddt-border">
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-semibold tracking-wide border-b-2 transition-all ${
                activeTab === "history"
                  ? "border-ddt-accent text-ddt-text"
                  : "border-transparent text-ddt-muted hover:text-ddt-text"
              }`}
            >
              Status History
            </button>
            <button
              onClick={() => setActiveTab("inspections")}
              className={`px-4 py-2 text-sm font-semibold tracking-wide border-b-2 transition-all ${
                activeTab === "inspections"
                  ? "border-ddt-accent text-ddt-text"
                  : "border-transparent text-ddt-muted hover:text-ddt-text"
              }`}
            >
              Site Inspections
            </button>
          </div>

          {activeTab === "history" ? (
            <StatusHistory project={project} />
          ) : (
            <SiteInspectionsReel projectId={project.id} />
          )}
        </div>
      </div>
    </div>
  );
}
