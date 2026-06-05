"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { Search, Loader2 } from "lucide-react";
import { NdtCode } from "@/components/ui/NdtCode";
import { StatusChip } from "@/components/ui/StatusChip";
import { cn } from "@/lib/utils";
import Link from "next/link";

type FilterType = "ndt_code" | "client_name" | "address" | "date" | "connection";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = trpc.search.projects.useQuery(
    {
      query: filterType === "date" ? "" : debouncedQuery,
      filterType,
      dateFrom: filterType === "date" ? dateFrom || undefined : undefined,
      dateTo: filterType === "date" ? dateTo || undefined : undefined,
    },
    {
      enabled:
        filterType === "date"
          ? !!(dateFrom || dateTo)
          : debouncedQuery.length > 0,
    }
  );

  const handlePillClick = (type: FilterType) => {
    if (filterType === type) {
      setFilterType(undefined);
    } else {
      setFilterType(type);
    }
  };

  const getPlaceholder = () => {
    switch (filterType) {
      case "ndt_code":
        return "Search by NDT code e.g. K007...";
      case "client_name":
        return "Search by client name...";
      case "address":
        return "Search by address...";
      case "connection":
        return "Search by referrer/connection...";
      default:
        return "Search projects...";
    }
  };

  const getSearchTermDescription = () => {
    if (filterType === "date") {
      if (dateFrom && dateTo) return `Date: ${dateFrom} to ${dateTo}`;
      if (dateFrom) return `Date: from ${dateFrom}`;
      if (dateTo) return `Date: up to ${dateTo}`;
      return "Date range";
    }
    return query;
  };

  const highlightText = (text: string | null | undefined, queryStr: string) => {
    if (!text) return null;
    if (!queryStr || filterType === "date") return <>{text}</>;
    // Case-insensitive regex split with escaping special regex characters
    const escapedQuery = queryStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === queryStr.toLowerCase() ? (
            <strong key={i} className="font-bold text-ddt-accent bg-ddt-accent/10 px-0.5 rounded">
              {part}
            </strong>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-ddt-text font-syne">Global Search</h1>
        <p className="text-ddt-muted text-sm">Search across all projects by client name, address, or NDT code.</p>
      </div>

      <div className="space-y-4">
        {/* Search Input or Date Picker */}
        {filterType === "date" ? (
          <div className="flex flex-col sm:flex-row gap-4 items-center w-full bg-ddt-surface border border-ddt-border rounded-xl p-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">From Date</label>
              <input
                type="date"
                className="block w-full px-4 py-3 bg-ddt-input border border-ddt-border rounded-xl text-ddt-text outline-none focus:border-ddt-accent transition-colors"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">To Date</label>
              <input
                type="date"
                className="block w-full px-4 py-3 bg-ddt-input border border-ddt-border rounded-xl text-ddt-text outline-none focus:border-ddt-accent transition-colors"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ddt-muted group-focus-within:text-ddt-accent transition-colors">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 h-12 bg-ddt-input border border-ddt-border rounded-xl text-base shadow-sm focus:border-ddt-accent transition-shadow outline-none placeholder:text-ddt-muted/60 text-ddt-text"
              placeholder={getPlaceholder()}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {isLoading && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Loader2 className="h-5 w-5 animate-spin text-ddt-muted" />
              </div>
            )}
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2">
          {(["ndt_code", "client_name", "address", "date", "connection"] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => handlePillClick(type)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium font-inter border transition-all cursor-pointer select-none",
                filterType === type
                  ? "bg-[#0D1F3C] border-[#1E3A5F] text-[#60A5FA]"
                  : "bg-[#1A2235] border-[#2A3550] text-[#8892A4] hover:text-white"
              )}
            >
              {type === "ndt_code"
                ? "NDT Code"
                : type === "client_name"
                ? "Client Name"
                : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {((filterType === "date" && (dateFrom || dateTo)) || (filterType !== "date" && debouncedQuery.length > 0)) && (
        <div className="mt-8 space-y-4 animate-in fade-in duration-300">
          <h2 className="text-sm font-semibold text-ddt-muted uppercase tracking-wider">
            {results ? `${results.length} results for '${getSearchTermDescription()}'` : "Search Results"}
          </h2>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-ddt-accent" />
            </div>
          )}

          {!isLoading && results?.length === 0 && (
            <div className="bg-ddt-surface border border-ddt-border rounded-xl p-8 text-center shadow-sm">
              <p className="text-ddt-text text-lg mb-2">
                No projects found for &quot;{getSearchTermDescription()}&quot;
              </p>
              <p className="text-sm text-ddt-muted">
                Try adjusting your search terms or selecting a different filter pill above.
              </p>
            </div>
          )}

          {!isLoading && results && results.length > 0 && (
            <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-sm overflow-hidden divide-y divide-ddt-border/50">
              {results.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-4 hover:bg-ddt-raised/30 transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <NdtCode code={project.ndt_code}>
                          {highlightText(project.ndt_code, debouncedQuery)}
                        </NdtCode>
                        <StatusChip status={project.status} />
                      </div>
                      <h3 className="font-semibold text-ddt-text group-hover:text-ddt-accent transition-colors">
                        {highlightText(project.client_name, debouncedQuery)}
                      </h3>
                      <p className="text-sm text-ddt-muted truncate max-w-md mt-0.5">
                        {highlightText(project.address, debouncedQuery)}
                      </p>
                      {project.connection && (
                        <p className="text-xs text-ddt-muted/80 mt-1">
                          Referrer: {highlightText(project.connection, debouncedQuery)}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-ddt-muted shrink-0 sm:text-right font-mono text-xs">
                      <p>
                        Site Date:{" "}
                        {new Date(project.site_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
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
