import { Database } from "./database";

export type ProjectStatus =
  Database["public"]["Tables"]["projects"]["Row"]["status"];
export type StageType =
  Database["public"]["Tables"]["project_stage_assignments"]["Row"]["stage"];
export type UserRole = Database["public"]["Tables"]["users"]["Row"]["role"];
export type StageStatus =
  Database["public"]["Tables"]["project_stage_assignments"]["Row"]["status"];

export type Project = Database["public"]["Tables"]["projects"]["Row"];

export type ProjectWithRelations = Project & {
  project_stage_assignments?: (StageAssignment & {
    assigned_user: { id?: string; full_name: string; role?: string } | null;
  })[];
  site_visits?: (SiteVisit & {
    staff_user: { id: string; full_name: string; role: string } | null;
  })[];
  proof_reviews?: (ProofReview & {
    reviewer_user: { id: string; full_name: string; role: string } | null;
  })[];
  status_history?: (Database["public"]["Tables"]["status_history"]["Row"] & {
    changed_by_user: { id: string; full_name: string; role: string } | null;
  })[];
};

export type StageAssignment =
  Database["public"]["Tables"]["project_stage_assignments"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type SiteVisit = Database["public"]["Tables"]["site_visits"]["Row"];
export type ProofReview = Database["public"]["Tables"]["proof_reviews"]["Row"];
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

export type ProfileWithTenant = User & {
  tenant: Tenant | null;
};

export type SubscriptionStatus =
  Database["public"]["Tables"]["tenants"]["Row"]["subscription_status"];

export type AICheckStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface BaseCheckResult {
  passed: boolean;
  issues: string[];
  suggestions: string[];
}

export interface ReportCheckResult {
  boiler_plate: BaseCheckResult;
  rebound_hammer: BaseCheckResult;
  rebar_depth: BaseCheckResult;
  core_compressive: BaseCheckResult;
  upv_testing: BaseCheckResult;
  carbonation: BaseCheckResult;
  crack_measurement: BaseCheckResult;
  conclusion: BaseCheckResult;
}

export interface ReportCheck {
  id: string;
  project_id: string;
  tenant_id: string;
  triggered_by: string;
  status: AICheckStatus;
  started_at: string;
  completed_at?: string;
  overall_score?: number;
  results_json?: ReportCheckResult;
  error_message?: string;
}
