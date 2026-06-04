import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ── Styles ──────────────────────────────────────────────────────────────────
const colors = {
  bg: "#0d0d0d",
  surface: "#141414",
  raised: "#1a1a1a",
  accent: "#E8A020",
  text: "#f0f0f0",
  muted: "#6b7280",
  faint: "#374151",
  emerald: "#34d399",
  red: "#f87171",
  border: "#2a2a2a",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: "Helvetica",
    padding: 40,
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottom: `1px solid ${colors.border}`,
  },
  logo: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.accent,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerLabel: {
    color: colors.muted,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerValue: {
    color: colors.text,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  reportTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  reportSubtitle: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 28,
  },
  staffCard: {
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  staffCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: `1px solid ${colors.border}`,
  },
  staffName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
  },
  staffRole: {
    fontSize: 8,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  efficiencyBadge: {
    backgroundColor: colors.accent,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  efficiencyText: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.raised,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    padding: 8,
  },
  statLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 8,
  },
  stageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottom: `0.5px solid ${colors.faint}`,
  },
  stageLabel: {
    color: colors.text,
    fontSize: 9,
  },
  stageValue: {
    color: colors.accent,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  faultRow: {
    backgroundColor: "#1f0a0a",
    border: `0.5px solid #3f1515`,
    borderRadius: 3,
    padding: 6,
    marginBottom: 4,
  },
  faultCode: {
    fontSize: 8,
    color: colors.red,
    fontFamily: "Helvetica-Bold",
  },
  faultReason: {
    fontSize: 7.5,
    color: colors.muted,
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `0.5px solid ${colors.border}`,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: colors.faint,
  },
});

// ── Component ────────────────────────────────────────────────────────────────
interface PerformanceReport {
  user: { id: string; full_name: string; role: string };
  stats: {
    stagesCompleted: number;
    stagesBreakdown: {
      analysis: number;
      sketch: number;
      report_writing: number;
      proofreading: number;
    };
    avgCompletionHours: number;
    faultCount: number;
    siteVisitsCount: number;
    efficiencyScore: number;
  };
  faultDetails: Array<{
    id: string;
    ndt_code: string;
    failure_reason: string;
    reviewed_at: string;
  }>;
}

interface Props {
  reports: PerformanceReport[];
  month: string; // e.g. "June 2025"
  labName: string;
}

export function PerformanceReportPdf({ reports, month, labName }: Props) {
  const generatedAt = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document
      title={`Performance Report — ${month}`}
      author={labName}
      creator="DDT Structure"
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.logo}>DDT Structure</Text>
            <Text style={{ color: colors.muted, fontSize: 8, marginTop: 2 }}>
              {labName}
            </Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerLabel}>Report Period</Text>
            <Text style={s.headerValue}>{month}</Text>
            <Text style={{ ...s.headerLabel, marginTop: 6 }}>Generated</Text>
            <Text style={s.headerValue}>{generatedAt}</Text>
          </View>
        </View>

        <Text style={s.reportTitle}>Staff Performance Report</Text>
        <Text style={s.reportSubtitle}>
          Monthly efficiency metrics, stage completions, site visits and fault log for{" "}
          {reports.length} team member{reports.length !== 1 ? "s" : ""}.
        </Text>

        {/* Staff Cards */}
        {reports.map((report) => (
          <View key={report.user.id} style={s.staffCard} wrap={false}>
            {/* Card Header */}
            <View style={s.staffCardHeader}>
              <View>
                <Text style={s.staffName}>{report.user.full_name}</Text>
                <Text style={s.staffRole}>
                  {report.user.role.replace(/_/g, " ")}
                </Text>
              </View>
              <View style={s.efficiencyBadge}>
                <Text style={s.efficiencyText}>
                  {report.stats.efficiencyScore}%
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={s.statsGrid}>
              <View style={s.statBox}>
                <Text style={s.statLabel}>Stages Done</Text>
                <Text style={s.statValue}>{report.stats.stagesCompleted}</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statLabel}>Site Visits</Text>
                <Text style={s.statValue}>{report.stats.siteVisitsCount}</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statLabel}>Avg Hours</Text>
                <Text style={s.statValue}>
                  {report.stats.avgCompletionHours.toFixed(1)}h
                </Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statLabel}>Faults</Text>
                <Text
                  style={{
                    ...s.statValue,
                    color:
                      report.stats.faultCount > 0 ? colors.red : colors.emerald,
                  }}
                >
                  {report.stats.faultCount}
                </Text>
              </View>
            </View>

            {/* Stage Breakdown */}
            <Text style={s.sectionTitle}>Stage Breakdown</Text>
            {Object.entries(report.stats.stagesBreakdown).map(([stage, count]) => (
              <View key={stage} style={s.stageRow}>
                <Text style={s.stageLabel}>{stage.replace(/_/g, " ")}</Text>
                <Text style={s.stageValue}>{count}</Text>
              </View>
            ))}

            {/* Faults */}
            {report.faultDetails.length > 0 && (
              <>
                <Text style={{ ...s.sectionTitle, color: colors.red }}>
                  Fault Log ({report.faultDetails.length})
                </Text>
                {report.faultDetails.map((fault) => (
                  <View key={fault.id} style={s.faultRow}>
                    <Text style={s.faultCode}>{fault.ndt_code}</Text>
                    {fault.failure_reason && (
                      <Text style={s.faultReason}>{fault.failure_reason}</Text>
                    )}
                  </View>
                ))}
              </>
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>DDT Structure — Confidential</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
