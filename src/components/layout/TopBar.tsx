"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";
import { NotificationPanel } from "./NotificationPanel";
import { useOfflineStore } from "@/stores/offline-store";
import { WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopBar({ title }: { title?: string }) {
  const pathname = usePathname();
  const { isOnline, isSyncing, topBarTitle, setTopBarTitle } = useOfflineStore();

  // Sync title prop to store
  useEffect(() => {
    if (title) {
      setTopBarTitle(title);
    }
    return () => {
      if (title) {
        setTopBarTitle(null);
      }
    };
  }, [title, setTopBarTitle]);

  // If this instance is just used to set the title (inside page.tsx), return null
  if (title) {
    return null;
  }

  // Basic title inference from pathname
  const segments = pathname.split("/").filter(Boolean);
  const rawTitle = segments[segments.length - 1] || "Dashboard";
  const defaultTitle =
    rawTitle.charAt(0).toUpperCase() +
    rawTitle.slice(1).replace(/-/g, " ");

  const displayTitle = topBarTitle || defaultTitle;

  return (
    <header className={cn(
      "h-[52px] border-b border-ddt-border flex items-center justify-between px-4 md:px-6 bg-ddt-bg/80 backdrop-blur-md sticky z-30 transition-all duration-200",
      isOnline ? "top-0" : "top-10"
    )}>
      <div className="flex items-center gap-4">
        <h1 className="text-md md:text-lg font-bold text-ddt-text font-syne truncate max-w-[150px] md:max-w-none">
          {displayTitle}
        </h1>
        <div
          id="sync-status-slot"
          className="hidden md:flex text-xs border-l border-ddt-border pl-4 items-center gap-2"
        >
          {!isOnline ? (
            <div className="flex items-center gap-2 text-ddt-error">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="font-semibold">Offline</span>
            </div>
          ) : isSyncing ? (
            <div className="flex items-center gap-2 text-ddt-accent">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-ddt-faint">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Synced</span>
            </div>
          )}
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
