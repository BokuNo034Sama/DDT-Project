"use client";

import { useOfflineStore } from "@/lib/store/offline-store";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Full-width amber banner at top of page when offline.
 */
export function OfflineBanner() {
  const isOnline = useOfflineStore((state) => state.isOnline);

  if (isOnline) return null;

  return (
    <div 
      className={cn(
        "bg-sky-500 text-black py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-tight shadow-lg z-[100] animate-in slide-in-from-top duration-500",
      )}
    >
      <div className="bg-black/10 p-1 rounded-full">
        <WifiOff className="w-4 h-4" />
      </div>
      <span>You&apos;re offline — changes will sync when reconnected.</span>
    </div>
  );
}
