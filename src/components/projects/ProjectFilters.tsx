"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ProjectStatus } from "@/types";

interface StatusFilterOption {
  label: string;
  value: ProjectStatus | undefined;
}

const statusFilters: StatusFilterOption[] = [
  { label: "All", value: undefined },
  { label: "Not Started", value: "not_started" },
  { label: "WIP", value: "wip" },
  { label: "Analysis Done", value: "analysis_done" },
  { label: "Sketch Done", value: "sketch_done" },
  { label: "Report Done", value: "report_done" },
  { label: "Report Bot Draft", value: "report_bot_draft" },
  { label: "Proof Ready", value: "proof_ready" },
  { label: "Uploaded", value: "report_uploaded" },
  { label: "Verified", value: "report_verified" },
  { label: "Delivered", value: "report_delivered" },
];

export function ProjectFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStatus = (searchParams.get("status") as ProjectStatus) || undefined;

  const handleFilterClick = (value: ProjectStatus | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    // Reset page to 1 when status filter changes
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-thin py-2">
      <div className="flex gap-2 min-w-max pb-1">
        {statusFilters.map((filter) => {
          const isActive = activeStatus === filter.value;
          return (
            <button
              key={filter.label}
              onClick={() => handleFilterClick(filter.value)}
              className="px-4 py-1.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              style={{
                background: isActive ? "rgba(59, 130, 246, 0.15)" : "var(--color-bg-input)",
                border: isActive ? "1px solid #3B82F6" : "1px solid var(--color-border)",
                color: isActive ? "#60A5FA" : "var(--color-text-secondary)",
                borderRadius: "999px",
              }}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
