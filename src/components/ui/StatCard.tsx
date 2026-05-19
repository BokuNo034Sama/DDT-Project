import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  label: string;
  trend?: { direction: "up" | "down"; text: string };
  primary?: boolean;
  className?: string;
}

/**
 * Metric display card with optional trend and primary styling.
 */
export function StatCard({
  value,
  label,
  trend,
  primary,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-1.5 transition-all hover:translate-y-[-2px] hover:shadow-md hover:border-border/60 group",
        primary && "border-l-4 border-l-primary",
        className
      )}
    >
      <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest group-hover:text-foreground transition-colors">
        {label}
      </span>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold font-syne tracking-tight">{value}</span>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase",
              trend.direction === "up" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpIcon className="w-3 h-3" />
            ) : (
              <ArrowDownIcon className="w-3 h-3" />
            )}
            {trend.text}
          </div>
        )}
      </div>
    </div>
  );
}
