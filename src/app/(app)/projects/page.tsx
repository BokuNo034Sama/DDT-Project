"use client";

import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
          <p className="text-muted-foreground">Manage your testing pipeline and assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Status Filters */}
      <ProjectFilters />

      {/* Projects Table */}
      <ProjectsTable />
    </div>
  );
}
