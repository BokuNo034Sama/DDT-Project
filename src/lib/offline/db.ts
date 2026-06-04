import Dexie, { type Table } from "dexie";

export interface OfflineProject {
  id: string;
  ndt_code: string;
  client_name: string;
  address: string;
  status: string;
  site_date: string;
  created_at: string;
  updated_at?: string;
}

export interface OfflineAssignment {
  id: string;
  project_id: string;
  stage: string;
  status: string;
  assigned_to: string;
  assigned_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface OfflineNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  is_read: boolean;
  created_at: string;
  related_project_id?: string;
}

export interface MutationQueueItem {
  id?: number;
  procedure: string;
  input: string; // JSON stringified
  createdAt: number;
  retries: number;
}

export interface SyncMeta {
  key: string;
  value: string;
}

class DdtOfflineDatabase extends Dexie {
  projects!: Table<OfflineProject>;
  stage_assignments!: Table<OfflineAssignment>;
  notifications!: Table<OfflineNotification>;
  mutation_queue!: Table<MutationQueueItem>;
  sync_meta!: Table<SyncMeta>;

  constructor() {
    super("DdtStructureOfflineDB");
    this.version(1).stores({
      projects: "id, status, created_at",
      stage_assignments: "id, project_id, assigned_to, status",
      notifications: "id, user_id, is_read, created_at",
      mutation_queue: "++id, procedure, createdAt",
      sync_meta: "key",
    });
  }
}

export const offlineDb = new DdtOfflineDatabase();
