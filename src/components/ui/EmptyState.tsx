import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Centered empty state display for lists and dashboard sections.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-8 text-center rounded-3xl border-2 border-dashed border-border/50 bg-card/30 backdrop-blur-sm",
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6 shadow-inner">
        <Inbox className="w-10 h-10 text-muted-foreground opacity-30" />
      </div>
      <h3 className="text-xl font-bold font-syne mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-[320px] mb-8 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="animate-in fade-in zoom-in duration-500 delay-200 fill-mode-both">
          {action}
        </div>
      )}
    </div>
  );
}
