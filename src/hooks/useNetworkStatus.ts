import { useState, useEffect } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc/client';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const utils = trpc.useUtils();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // CRITICAL WAKE-UP LOGIC: Force cache synchronization when connection recovers
  useEffect(() => {
    if (isOnline) {
      // 1. Tell TanStack Query's core execution manager that the network is officially clear
      onlineManager.setOnline(true);
      
      // 2. Trigger an immediate, asynchronous application-wide query invalidation sweep
      // This forces all visible UI lists and stats counters to pull fresh live rows from Supabase
      utils.invalidate().catch((err) => console.log("Reconnection refresh delayed:", err));
    } else {
      onlineManager.setOnline(false);
    }
  }, [isOnline, utils]);

  return isOnline;
}
