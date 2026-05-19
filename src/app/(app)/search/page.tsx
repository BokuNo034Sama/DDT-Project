"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { Search, Loader2 } from "lucide-react";
import { NdtCode } from "@/components/ui/NdtCode";
import { StatusChip } from "@/components/ui/StatusChip";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = trpc.search.projects.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 }
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Search</h1>
        <p className="text-muted-foreground">Search across all projects by client name, address, or NDT code.</p>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-4 bg-card border border-border rounded-xl text-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow outline-none placeholder:text-muted-foreground/60"
          placeholder="e.g. Dangote or K001..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {debouncedQuery.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Search Results {results ? `(${results.length})` : ""}
          </h2>

          {!isLoading && results?.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center shadow-sm">
              <p className="text-muted-foreground text-lg mb-2">No projects found for &quot;{debouncedQuery}&quot;</p>
              <p className="text-sm text-muted-foreground/80">Try adjusting your search terms.</p>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden divide-y divide-border">
              {results.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-4 hover:bg-secondary/30 transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <NdtCode code={project.ndt_code} />
                        <StatusChip status={project.status as "not_started" | "wip" | "analysis_done" | "sketch_done" | "report_done" | "proof_ready" | "report_uploaded"} />
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {project.client_name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {project.address}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0 sm:text-right">
                      <p>Site Date: {new Date(project.site_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
