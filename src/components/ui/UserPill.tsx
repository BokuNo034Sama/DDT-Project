import { cn } from "@/lib/utils";
import { AvatarCircle } from "./AvatarCircle";

interface UserPillProps {
  name: string;
  avatarInitials?: string;
  className?: string;
}

/**
 * Small staff name badge with dark surface background and secondary text.
 */
export function UserPill({ name, avatarInitials, className }: UserPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border/50 shadow-sm",
        className
      )}
    >
      {avatarInitials && (
        <AvatarCircle initials={avatarInitials} size="sm" className="flex-shrink-0" />
      )}
      <span className="text-sm font-medium whitespace-nowrap">{name}</span>
    </div>
  );
}
