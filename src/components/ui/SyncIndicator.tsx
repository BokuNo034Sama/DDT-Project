"use client";

import { useOfflineStore } from "@/lib/store/offline-store";
import { cn } from "@/lib/utils";
import { CloudOff, CloudSync, CheckCircle2 } from "lucide-react";

/**
 * Small indicator for the TopBar showing online/offline status 
 * and pending sync queue count.
 */
export function SyncIndicator() {
  const { isOnline, pendingSyncCount } = useOfflineStore();
  
  const isSyncing = isOnline && pendingSyncCount > 0;
  const isOffline = !isOnline;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-all duration-500",
        isOffline && "bg-destructive/10 text-destructive-foreground border-destructive/20",
        isSyncing && "bg-sky-500/10 text-sky-500 border-sky-500/20",
        !isOffline && !isSyncing && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      )}
    >
      <div className="relative flex h-2 w-2">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            isOffline && "bg-destructive-foreground",
            isSyncing && "bg-sky-500",
            !isOffline && !isSyncing && "bg-emerald-500"
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            isOffline && "bg-destructive-foreground",
            isSyncing && "bg-sky-500",
            !isOffline && !isSyncing && "bg-emerald-500"
          )}
        />
      </div>
      
      <span className="hidden md:inline uppercase tracking-tighter">
        {isOffline ? "Offline" : isSyncing ? `Syncing (${pendingSyncCount})` : "Online"}
      </span>
      
      <div className="md:hidden">
        {isOffline ? (
          <CloudOff className="w-3.5 h-3.5" />
        ) : isSyncing ? (
          <CloudSync className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5" />
        )}
      </div>
    </div>
  );
}
