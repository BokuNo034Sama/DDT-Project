"use client";

import { trpc } from "@/lib/trpc/client";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { PipelineBar } from "@/components/projects/PipelineBar";
import { SiteVisitsList } from "@/components/projects/SiteVisitsList";
import { StatusHistory } from "@/components/projects/StatusHistory";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: project, isLoading, error } = trpc.projects.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
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

      {/* Detailed site logs and history timeline grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="md:col-span-1">
          <SiteVisitsList project={project} />
        </div>
        <div className="md:col-span-2">
          <StatusHistory project={project} />
        </div>
      </div>
    </div>
  );
}
