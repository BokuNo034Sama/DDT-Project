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
    assigned_user: { id: string; full_name: string; role: string } | null;
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
