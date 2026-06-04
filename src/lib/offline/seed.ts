import { offlineDb } from "./db";
import { setSyncMeta } from "./sync";

interface SeedOptions {
  userId: string;
  tenantId: string;
}

/**
 * Seeds the local Dexie database after authentication.
 * Fetches recent projects, assignments and notifications from the API.
 */
export async function seedOfflineDb({ userId, tenantId }: SeedOptions): Promise<void> {
  try {
    // Fetch recent projects
    const projectsRes = await fetch("/api/trpc/projects.list", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (projectsRes.ok) {
      const { result } = await projectsRes.json();
      const projects = result?.data?.json?.items ?? [];
      await offlineDb.projects.bulkPut(projects);
    }

    // Fetch active assignments for user
    const assignmentsRes = await fetch("/api/trpc/stages.getMyStages", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (assignmentsRes.ok) {
      const { result } = await assignmentsRes.json();
      const assignments = result?.data?.json ?? [];
      await offlineDb.stage_assignments.bulkPut(assignments);
    }

    // Fetch notifications
    const notificationsRes = await fetch("/api/trpc/notifications.list", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (notificationsRes.ok) {
      const { result } = await notificationsRes.json();
      const notifications = result?.data?.json ?? [];
      await offlineDb.notifications.bulkPut(notifications);
    }

    await setSyncMeta("lastSeedAt", new Date().toISOString());
    await setSyncMeta("seedUserId", userId);
    await setSyncMeta("seedTenantId", tenantId);
  } catch {
    // Seeding is best-effort; failures are silently swallowed
  }
}
