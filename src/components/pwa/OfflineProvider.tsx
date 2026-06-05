"use client";

import { useEffect, useState } from "react";
import { useOfflineStore } from "@/stores/offline-store";
import { initNetworkSync } from "@/lib/offline/sync";
import { getPendingCount } from "@/lib/offline/queue";

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { setOnline, setIsSyncing, setPendingQueueLength } = useOfflineStore();

  useEffect(() => {
    setMounted(true);
    // Initial status checks
    setOnline(navigator.onLine);

    const updateQueue = async () => {
      const count = await getPendingCount();
      setPendingQueueLength(count);
    };

    updateQueue();

    // Listeners for raw window events
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initialize sync behavior
    const cleanupSync = initNetworkSync(async (syncedCount) => {
      setIsSyncing(true);
      // Let the sync finish before turning off syncing
      setTimeout(async () => {
        setIsSyncing(false);
        await updateQueue();
      }, 1000);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      cleanupSync();
    };
  }, [setOnline, setIsSyncing, setPendingQueueLength]);

  if (!mounted) return null;

  return <>{children}</>;
}
