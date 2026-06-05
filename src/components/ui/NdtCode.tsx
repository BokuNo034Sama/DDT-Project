import { cn } from "@/lib/utils";

interface NdtCodeProps {
  code?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Renders NDT code in JetBrains Mono font, amber colour.
 */
export function NdtCode({ code, className, children }: NdtCodeProps) {
  return (
    <code
      className={cn(
        "font-mono text-primary font-bold tracking-tight bg-primary/10 px-1.5 py-0.5 rounded",
        className
      )}
    >
      {children || code}
    </code>
  );
}
