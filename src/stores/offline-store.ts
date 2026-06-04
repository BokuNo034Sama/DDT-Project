import { create } from "zustand";

interface OfflineStoreState {
  isOnline: boolean;
  pendingQueueLength: number;
  isSyncing: boolean;
  setOnline: (online: boolean) => void;
  setPendingQueueLength: (length: number) => void;
  setIsSyncing: (syncing: boolean) => void;
}

export const useOfflineStore = create<OfflineStoreState>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  pendingQueueLength: 0,
  isSyncing: false,
  setOnline: (online) => set({ isOnline: online }),
  setPendingQueueLength: (length) => set({ pendingQueueLength: length }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
}));
