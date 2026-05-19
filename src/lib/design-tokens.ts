export type ProjectStatus =
  | "not_started"
  | "wip"
  | "analysis_done"
  | "sketch_done"
  | "report_done"
  | "proof_ready"
  | "report_uploaded"
  | "report_verified"
  | "report_delivered"
  | "proof_failed";

export const STATUS_CHIP_STYLES: Record<
  ProjectStatus,
  { bg: string; text: string; border: string }
> = {
  not_started: {
    bg: "var(--status-not-started-bg)",
    text: "var(--status-not-started-text)",
    border: "var(--status-not-started-border)",
  },
  wip: {
    bg: "var(--status-wip-bg)",
    text: "var(--status-wip-text)",
    border: "var(--status-wip-border)",
  },
  analysis_done: {
    bg: "var(--status-analysis-done-bg)",
    text: "var(--status-analysis-done-text)",
    border: "var(--status-analysis-done-border)",
  },
  sketch_done: {
    bg: "var(--status-sketch-done-bg)",
    text: "var(--status-sketch-done-text)",
    border: "var(--status-sketch-done-border)",
  },
  report_done: {
    bg: "var(--status-report-done-bg)",
    text: "var(--status-report-done-text)",
    border: "var(--status-report-done-border)",
  },
  proof_ready: {
    bg: "var(--status-proof-ready-bg)",
    text: "var(--status-proof-ready-text)",
    border: "var(--status-proof-ready-border)",
  },
  report_uploaded: {
    bg: "var(--status-report-uploaded-bg)",
    text: "var(--status-report-uploaded-text)",
    border: "var(--status-report-uploaded-border)",
  },
  report_verified: {
    bg: "var(--status-report-verified-bg)",
    text: "var(--status-report-verified-text)",
    border: "var(--status-report-verified-border)",
  },
  report_delivered: {
    bg: "var(--status-report-delivered-bg)",
    text: "var(--status-report-delivered-text)",
    border: "var(--status-report-delivered-border)",
  },
  proof_failed: {
    bg: "var(--status-proof-failed-bg)",
    text: "var(--status-proof-failed-text)",
    border: "var(--status-proof-failed-border)",
  },
};
