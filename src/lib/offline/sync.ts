import { offlineDb } from "./db";
import { getPendingMutations, dequeueMutation } from "./queue";

/**
 * Syncs pending mutations back to the server when network is restored.
 * Calls the relevant tRPC API route for each queued mutation.
 */
export async function syncPendingMutations(): Promise<number> {
  const pending = await getPendingMutations();
  let synced = 0;

  for (const item of pending) {
    try {
      const input = JSON.parse(item.input);

      // Map procedure name to API path
      const response = await fetch(`/api/trpc/${item.procedure}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: input }),
      });

      if (response.ok) {
        if (item.id !== undefined) {
          await dequeueMutation(item.id);
        }
        synced++;
      }
    } catch {
      // Leave in queue for next sync attempt
    }
  }

  return synced;
}

/**
 * Sets up online/offline event listeners to trigger sync on reconnect.
 */
export function initNetworkSync(onSync?: (count: number) => void): () => void {
  const handleOnline = async () => {
    const count = await syncPendingMutations();
    if (onSync && count > 0) onSync(count);
  };

  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
}

/**
 * Updates sync metadata in the local db.
 */
export async function setSyncMeta(key: string, value: string): Promise<void> {
  await offlineDb.sync_meta.put({ key, value });
}

export async function getSyncMeta(key: string): Promise<string | undefined> {
  const row = await offlineDb.sync_meta.get(key);
  return row?.value;
}
