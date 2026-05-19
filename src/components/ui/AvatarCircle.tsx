import { cn } from "@/lib/utils";

interface AvatarCircleProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-12 h-12 text-base",
};

/**
 * Circular initials avatar with blue-tinted background.
 */
export function AvatarCircle({
  initials,
  size = "md",
  className,
}: AvatarCircleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-blue-900/40 text-blue-300 border border-blue-500/30 font-bold uppercase select-none",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
