import { offlineDb, type MutationQueueItem } from "./db";

/**
 * Adds a failed mutation to the offline queue for later sync.
 */
export async function enqueueMutation(
  procedure: string,
  input: Record<string, unknown>
): Promise<void> {
  await offlineDb.mutation_queue.add({
    procedure,
    input: JSON.stringify(input),
    createdAt: Date.now(),
    retries: 0,
  });
}

/**
 * Returns all pending mutations in the queue.
 */
export async function getPendingMutations(): Promise<MutationQueueItem[]> {
  return offlineDb.mutation_queue.orderBy("createdAt").toArray();
}

/**
 * Removes a processed mutation from the queue.
 */
export async function dequeueMutation(id: number): Promise<void> {
  await offlineDb.mutation_queue.delete(id);
}

/**
 * Returns the count of pending mutations.
 */
export async function getPendingCount(): Promise<number> {
  return offlineDb.mutation_queue.count();
}
