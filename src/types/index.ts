import { Database } from "./database";

export type ProjectStatus =
  Database["public"]["Tables"]["projects"]["Row"]["status"];
export type StageType =
  Database["public"]["Tables"]["project_stage_assignments"]["Row"]["stage"];
export type UserRole = Database["public"]["Tables"]["users"]["Row"]["role"];
export type StageStatus =
  Database["public"]["Tables"]["project_stage_assignments"]["Row"]["status"];

export type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  stage_assignments?: StageAssignment[];
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
