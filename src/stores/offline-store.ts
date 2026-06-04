import { create } from "zustand";

interface OfflineStoreState {
  isOnline: boolean;
  pendingQueueLength: number;
  isSyncing: boolean;
  topBarTitle: string | null;
  setOnline: (online: boolean) => void;
  setPendingQueueLength: (length: number) => void;
  setIsSyncing: (syncing: boolean) => void;
  setTopBarTitle: (title: string | null) => void;
}

export const useOfflineStore = create<OfflineStoreState>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  pendingQueueLength: 0,
  isSyncing: false,
  topBarTitle: null,
  setOnline: (online) => set({ isOnline: online }),
  setPendingQueueLength: (length) => set({ pendingQueueLength: length }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  setTopBarTitle: (title) => set({ topBarTitle: title }),
}));
