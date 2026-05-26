"use client";

import { trpc } from "@/lib/trpc/client";
import { NdtCode } from "@/components/ui/NdtCode";
import { StatusChip } from "@/components/ui/StatusChip";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { ArrowLeft, User, Calendar, MapPin, CheckCircle2, Circle } from "lucide-react";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: project, isLoading, error } = trpc.projects.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <EmptyState
          title="Project Not Found"
          description="The project you are looking for does not exist or you don't have permission to view it."
          action={
            <button 
              onClick={() => window.location.assign("/projects")}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              Back to Projects
            </button>
          }
        />
      </div>
    );
  }

  const pipelineStages = [
    { id: "not_started", label: "Registered" },
    { id: "wip", label: "Work in Progress" },
    { id: "analysis_done", label: "Analysis" },
    { id: "sketch_done", label: "Sketch" },
    { id: "report_done", label: "Report" },
    { id: "proof_ready", label: "Proofread" },
    { id: "report_uploaded", label: "Completed" },
  ];

  const currentStageIndex = pipelineStages.findIndex((s) => s.id === project.status);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/projects"
          className="w-fit p-2 -ml-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <NdtCode code={project.ndt_code} className="text-2xl" />
              <StatusChip status={project.status as "not_started" | "wip" | "analysis_done" | "sketch_done" | "report_done" | "proof_ready" | "report_uploaded"} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {project.client_name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Actions would go here */}
          </div>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6 overflow-hidden">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
          Project Pipeline
        </h2>
        <div className="relative flex justify-between items-center w-full">
          {/* Connecting Line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-secondary -z-10" />
          
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-10"
            style={{ width: `${Math.max(0, (currentStageIndex / (pipelineStages.length - 1)) * 100)}%` }}
          />

          {pipelineStages.map((stage, index) => {
            const isCompleted = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            
            return (
              <div key={stage.id} className="flex flex-col items-center gap-2 bg-card px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isCompleted ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 col-span-1 space-y-6">
          <h2 className="text-lg font-semibold tracking-tight">Details</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Address</p>
                <p className="text-sm text-muted-foreground">{project.address}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Site Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(project.site_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {project.number_of_floors && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Floors</p>
                  <p className="text-sm text-muted-foreground">{project.number_of_floors}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stage Assignments placeholder */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 col-span-1 md:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight mb-4">Stage Assignments</h2>
          <div className="flex items-center justify-center h-40 bg-secondary/20 rounded-lg border border-dashed border-border">
             <p className="text-muted-foreground text-sm">Stage assignment components will go here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
