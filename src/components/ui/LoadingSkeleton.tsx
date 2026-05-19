import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  rows?: number;
  type: "table" | "cards" | "detail";
  className?: string;
}

/**
 * Animated skeleton loader with different layout presets.
 */
export function LoadingSkeleton({
  rows = 3,
  type,
  className,
}: LoadingSkeletonProps) {
  if (type === "table") {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 py-4 border-b border-border/40 animate-pulse">
            <div className="h-12 w-12 bg-secondary rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-secondary rounded-lg w-1/4" />
              <div className="h-3 bg-secondary/60 rounded-lg w-1/2" />
            </div>
            <div className="h-8 bg-secondary rounded-full w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "cards") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-card border border-border space-y-5 animate-pulse">
            <div className="space-y-2">
              <div className="h-3 bg-secondary rounded-full w-1/4" />
              <div className="h-6 bg-secondary rounded-lg w-3/4" />
            </div>
            <div className="h-24 bg-secondary/40 rounded-xl w-full" />
            <div className="flex justify-between items-center">
              <div className="h-4 bg-secondary rounded-full w-20" />
              <div className="h-8 bg-secondary rounded-xl w-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-secondary rounded-xl w-1/3" />
        <div className="h-4 bg-secondary rounded-lg w-2/3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-secondary rounded-full w-1/4" />
          <div className="h-32 bg-secondary/40 rounded-2xl w-full" />
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-secondary rounded-full w-1/4" />
          <div className="h-32 bg-secondary/40 rounded-2xl w-full" />
        </div>
      </div>
      <div className="h-64 bg-secondary/20 rounded-3xl w-full animate-pulse" />
    </div>
  );
}
