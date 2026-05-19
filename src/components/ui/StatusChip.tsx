import { ProjectStatus, STATUS_CHIP_STYLES } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface StatusChipProps {
  status: ProjectStatus;
  className?: string;
}

/**
 * Renders a coloured pill badge for any ProjectStatus.
 * Uses STATUS_CHIP_STYLES from design tokens.
 */
export function StatusChip({ status, className }: StatusChipProps) {
  const styles = STATUS_CHIP_STYLES[status] || STATUS_CHIP_STYLES.not_started;
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200 shadow-sm",
        className
      )}
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        borderColor: styles.border,
      }}
    >
      <span className="capitalize">{status.replace(/_/g, " ")}</span>
    </span>
  );
}
