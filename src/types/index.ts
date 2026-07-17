import { Database } from "./database";

export type ProjectStatus =
  Database["public"]["Tables"]["projects"]["Row"]["status"];
export type LsmtlStatus =
  Database["public"]["Tables"]["projects"]["Row"]["lsmtl_status"];
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

export type ReportDraft = Database["public"]["Tables"]["report_drafts"]["Row"];

export interface LabEquipment {
  id: string
  tenantId: string
  equipmentName: string
  serialNumber: string
  equipmentType: string
  isActive: boolean
  createdAt: string
}

export interface SiteVisitEquipment {
  id: string
  siteVisitId: string
  equipmentId: string
  equipment?: LabEquipment
  transducerOk: boolean
  displayOk: boolean
  cablesOk: boolean
  batteryStatus: string
}

export interface RebarMeasurements {
  profoscopeId: string       // equipment ID from lab_equipment
  profoscopeName: string
  profoscopeSerial: string
  column: { mainBar: number; links: number; spacing: number; coverDepth: number }
  beam:   { mainBar: number; links: number; spacing: number; coverDepth: number }
  slab:   { mainBar: string; links: string; spacing: number; coverDepth: number }
}

export interface ExcelFloorData {
  floorName: string      // e.g. "Ground Floor", "First Floor"
  sheetKey: string       // e.g. "Gf", "FF"
  columns: ElementData[]
  beams: ElementData[]
  slabs: ElementData[]
  shearWalls: ElementData[]
}

export interface ElementData {
  elementId: string       // e.g. "C1", "B2", "S3"
  trials: {
    trial: 'A' | 'B' | 'C'
    transmissionTime: number
    pathLength: number
    velocity: number
    ecs: number
  }[]
  averageEcs: number
  remark: string          // "GOOD" or "POOR"
}

export interface ReportDraftInput {
  projectId: string
  concreteGrade: string
  drawingProvided: boolean
  rebarData: RebarMeasurements
  equipmentChecks: SiteVisitEquipment[]
}
