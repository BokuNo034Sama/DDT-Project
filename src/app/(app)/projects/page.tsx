"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { NdtCode } from "@/components/ui/NdtCode";
import { StatusChip } from "@/components/ui/StatusChip";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { Filter, Plus } from "lucide-react";

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const { data: projectsData, isLoading } = trpc.projects.list.useQuery({
    cursor: (page - 1) * 20,
    limit: 20,
  });

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
          <p className="text-muted-foreground">Manage your testing pipeline and assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors border border-border">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton type="table" />
      ) : !projectsData || projectsData.items.length === 0 ? (
        <div className="pt-10">
          <EmptyState
            title="No projects found"
            description="You don't have any active projects. Create one to get started."
            action={
              <button 
                onClick={() => window.location.assign("/projects/new")}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
              >
                Create Project
              </button>
            }
          />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          {projectsData.items.some((p: { is_sample?: boolean }) => p.is_sample) && (
            <div className="bg-[#A3E635]/10 border-b border-[#A3E635]/30 p-4 flex items-center justify-center">
              <p className="text-sm font-medium text-[#1A1917]">
                <span className="font-bold text-[#3B82F6]">Welcome to your sandbox!</span> We&apos;ve added a sample project so you can explore the pipeline immediately.
              </p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">NDT Code</th>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Address</th>
                  <th className="px-6 py-4 font-medium">Site Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projectsData.items.map((project: { id: string; ndt_code: string; client_name: string; address: string; site_date: string; status: string; is_sample?: boolean }) => (
                  <tr
                    key={project.id}
                    className="hover:bg-secondary/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <NdtCode code={project.ndt_code} />
                        {project.is_sample && (
                          <span className="px-2 py-0.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-bold font-syne uppercase tracking-wider">
                            Sample
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {project.client_name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">
                      {project.address}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(project.site_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip status={project.status as "not_started" | "wip" | "analysis_done" | "sketch_done" | "report_done" | "report_bot_draft" | "proof_ready" | "report_uploaded"} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-primary hover:text-primary/80 font-medium text-sm transition-colors opacity-0 group-hover:opacity-100"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {Math.ceil((projectsData.totalCount || 0) / 20) > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-secondary/20">
              <span className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil((projectsData.totalCount || 0) / 20)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-border rounded hover:bg-secondary disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(Math.ceil((projectsData.totalCount || 0) / 20), p + 1))}
                  disabled={page === Math.ceil((projectsData.totalCount || 0) / 20)}
                  className="px-3 py-1 text-sm border border-border rounded hover:bg-secondary disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
