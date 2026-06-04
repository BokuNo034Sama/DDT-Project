import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    color: "#333333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: "#E8A020",
    paddingBottom: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111111",
  },
  subtitle: {
    fontSize: 12,
    color: "#666666",
  },
  section: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "bold",
  },
  value: {
    fontSize: 10,
    color: "#111111",
  },
  statBoxContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    marginHorizontal: 5,
    backgroundColor: "#ffffff",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111111",
  },
  statLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#6b7280",
    marginTop: 4,
  },
  efficiencyScore: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E8A020",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});

interface PerformanceReportPdfProps {
  data: any[];
  month: number;
  year: number;
}

export const PerformanceReportPdf = ({ data, month, year }: PerformanceReportPdfProps) => {
  const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Performance Report</Text>
            <Text style={styles.subtitle}>
              {monthName} {year}
            </Text>
          </View>
          <Text style={{ fontSize: 10, color: "#9ca3af" }}>
            Generated: {new Date().toLocaleDateString()}
          </Text>
        </View>

        {data.map((report) => (
          <View key={report.user.id} style={styles.section} wrap={false}>
            <View style={styles.row}>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#111111" }}>
                {report.user.full_name}
              </Text>
              <Text style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase" }}>
                {report.user.role.replace("_", " ")}
              </Text>
            </View>

            <View style={styles.statBoxContainer}>
              <View style={[styles.statBox, { marginLeft: 0 }]}>
                <Text style={styles.efficiencyScore}>{report.stats.efficiencyScore}</Text>
                <Text style={styles.statLabel}>Efficiency Score</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{report.stats.stagesCompleted}</Text>
                <Text style={styles.statLabel}>Tasks Completed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{report.stats.avgCompletionHours.toFixed(1)}h</Text>
                <Text style={styles.statLabel}>Avg Duration</Text>
              </View>
              <View style={[styles.statBox, { marginRight: 0 }]}>
                <Text style={[styles.statValue, { color: report.stats.faultCount > 0 ? "#ef4444" : "#111111" }]}>
                  {report.stats.faultCount}
                </Text>
                <Text style={styles.statLabel}>Faults</Text>
              </View>
            </View>
            
            <View style={{ marginTop: 15 }}>
              <Text style={styles.label}>TASK BREAKDOWN:</Text>
              <View style={{ flexDirection: "row", marginTop: 5 }}>
                <Text style={styles.value}>Analysis: {report.stats.stagesBreakdown.analysis}  |  </Text>
                <Text style={styles.value}>Sketch: {report.stats.stagesBreakdown.sketch}  |  </Text>
                <Text style={styles.value}>Report Writing: {report.stats.stagesBreakdown.report_writing}  |  </Text>
                <Text style={styles.value}>Proofreading: {report.stats.stagesBreakdown.proofreading}</Text>
              </View>
            </View>
            
            {report.stats.siteVisitsCount > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>SITE VISITS: {report.stats.siteVisitsCount}</Text>
              </View>
            )}
          </View>
        ))}

        {data.length === 0 && (
          <Text style={{ fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 50 }}>
            No performance data available for this period.
          </Text>
        )}

        <View style={styles.footer}>
          <Text>DDT Structure • Confidential Laboratory Performance Report</Text>
        </View>
      </Page>
    </Document>
  );
};
