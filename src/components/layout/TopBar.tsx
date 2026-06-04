"use client";

import { RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";
import { NotificationPanel } from "./NotificationPanel";

export function TopBar() {
  const pathname = usePathname();

  // Basic title inference from pathname
  const segments = pathname.split("/").filter(Boolean);
  const rawTitle = segments[segments.length - 1] || "Dashboard";
  const title =
    rawTitle.charAt(0).toUpperCase() +
    rawTitle.slice(1).replace(/-/g, " ");

  return (
    <header className="h-[52px] border-b border-ddt-border flex items-center justify-between px-4 md:px-6 bg-ddt-bg/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-md md:text-lg font-bold text-ddt-text font-syne truncate max-w-[150px] md:max-w-none">
          {title}
        </h1>
        <div
          id="sync-status-slot"
          className="hidden md:flex text-ddt-faint items-center gap-2 text-xs border-l border-ddt-border pl-4"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Synced</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <NotificationPanel />
        <div id="topbar-action-slot">
          {/* Slot for primary CTA button from PageShell */}
        </div>
      </div>
    </header>
  );
}
