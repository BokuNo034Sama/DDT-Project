import { ProjectStatus, StageType, UserRole } from "@/types";

export const STATUS_ORDER: ProjectStatus[] = [
  "not_started",
  "wip",
  "analysis_done",
  "sketch_done",
  "report_done",
  "proof_ready",
  "report_uploaded",
  "report_verified",
  "report_delivered",
];

export const STAGE_TO_STATUS: Record<StageType, ProjectStatus> = {
  analysis: "analysis_done",
  sketch: "sketch_done",
  report_writing: "report_done",
  proofreading: "proof_ready",
};

/**
 * Checks if a user role can manually transition a project status.
 */
export function canTransitionTo(
  from: ProjectStatus,
  to: ProjectStatus,
  role: UserRole
): boolean {
  if (role === "super_admin") return true;
  if (role === "staff") return false; // Staff only updates via stages

  // Managers/Owners can transition manually
  return true;
}

/**
 * Returns the status a project should move to after a specific stage is completed.
 */
export function getNextStatus(
  currentStatus: ProjectStatus,
  completedStage: StageType
): ProjectStatus {
  return STAGE_TO_STATUS[completedStage] || currentStatus;
}
