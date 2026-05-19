import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaultBadgeProps {
  count: number;
  className?: string;
}

/**
 * Red badge with warning icon and fault count. Hidden if count === 0.
 */
export function FaultBadge({ count, className }: FaultBadgeProps) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-destructive text-destructive-foreground text-xs font-bold border border-destructive-foreground/20 animate-pulse",
        className
      )}
    >
      <AlertCircle className="w-3.5 h-3.5" />
      <span>{count} FAULTS</span>
    </div>
  );
}
