"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { NdtCode } from "@/components/ui/NdtCode";
import { StatusChip } from "@/components/ui/StatusChip";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { ProjectStatus } from "@/types";

export function ProjectsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = (searchParams.get("status") as ProjectStatus) || undefined;
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  const { data, isLoading } = trpc.projects.list.useQuery(
    {
      status: statusFilter,
      page,
      limit: 20,
    },
    {
      placeholderData: (prev) => prev,
    }
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  if (isLoading) {
    return <LoadingSkeleton type="table" />;
  }

  if (!data || data.projects.length === 0) {
    return (
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
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      {data.projects.some((p) => p.is_sample) && (
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
            {data.projects.map((project) => (
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
                  <StatusChip
                    status={
                      project.status as
                        | "not_started"
                        | "wip"
                        | "analysis_done"
                        | "sketch_done"
                        | "report_done"
                        | "report_bot_draft"
                        | "proof_ready"
                        | "report_uploaded"
                    }
                  />
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
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-secondary/20">
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, data.page - 1))}
              disabled={data.page === 1}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-secondary disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(Math.min(data.totalPages, data.page + 1))}
              disabled={data.page === data.totalPages}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-secondary disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
