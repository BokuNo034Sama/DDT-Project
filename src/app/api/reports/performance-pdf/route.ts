import { type NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { PerformanceReportPdf } from "@/lib/pdf/PerformanceReportPdf";
import { calculateEfficiencyScore } from "@/server/utils/efficiency";
import React from "react";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = user.app_metadata?.role as string;
    if (role === "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = user.app_metadata?.tenant_id as string;
    const body = await req.json();
    const { month, year } = body;

    if (!month || !year) {
      return NextResponse.json({ error: "month and year are required" }, { status: 400 });
    }

    // Fetch tenant name
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", tenantId)
      .single();

    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    // Fetch users
    const { data: usersData } = await supabase
      .from("users")
      .select("id, full_name, role")
      .eq("tenant_id", tenantId)
      .in("role", ["staff", "ops_manager"]);

    const users = usersData ?? [];

    // Fetch performance data
    const [assignmentsRes, siteVisitsRes, faultsRes] = await Promise.all([
      supabase
        .from("project_stage_assignments")
        .select("*, projects(ndt_code)")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("completed_at", startDate)
        .lte("completed_at", endDate),
      supabase
        .from("site_visits")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("visit_date", startDate)
        .lte("visit_date", endDate),
      supabase
        .from("proof_reviews")
        .select("*, projects(ndt_code)")
        .eq("tenant_id", tenantId)
        .eq("result", "fail")
        .gte("reviewed_at", startDate)
        .lte("reviewed_at", endDate),
    ]);

    const assignments = (assignmentsRes.data ?? []) as any[];
    const siteVisits = (siteVisitsRes.data ?? []) as any[];
    const faults = (faultsRes.data ?? []) as any[];

    // Build report data
    const reports = users.map((user: any) => {
      const userAssignments = assignments.filter((a) => a.assigned_to === user.id);
      const userVisits = siteVisits.filter((sv) => sv.staff_id === user.id);
      const userFaults = faults.filter((f) => f.report_handler_id === user.id);

      const stagesCompleted = userAssignments.length;
      const siteVisitsCount = userVisits.length;
      const faultCount = userFaults.length;

      const stagesBreakdown = {
        analysis: userAssignments.filter((a) => a.stage === "analysis").length,
        sketch: userAssignments.filter((a) => a.stage === "sketch").length,
        report_writing: userAssignments.filter((a) => a.stage === "report_writing").length,
        proofreading: userAssignments.filter((a) => a.stage === "proofreading").length,
      };

      let totalHours = 0;
      let validAssignments = 0;

      for (const a of userAssignments) {
        if (a.started_at && a.completed_at) {
          const hours = (new Date(a.completed_at).getTime() - new Date(a.started_at).getTime()) / 3_600_000;
          if (hours > 0) { totalHours += hours; validAssignments++; }
        }
      }
      const avgCompletionHours = validAssignments > 0 ? totalHours / validAssignments : 0;
      const efficiencyScore = calculateEfficiencyScore(stagesCompleted, avgCompletionHours, faultCount, siteVisitsCount);

      const faultDetails = userFaults.map((f) => ({
        id: f.id,
        ndt_code: f.projects?.ndt_code ?? "—",
        failure_reason: f.failure_reason ?? "",
        reviewed_at: f.reviewed_at,
      }));

      return {
        user,
        stats: { stagesCompleted, stagesBreakdown, avgCompletionHours, faultCount, siteVisitsCount, efficiencyScore },
        faultDetails,
      };
    });

    // Format month label
    const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-GB", {
      month: "long",
      year: "numeric",
    });

    // Render PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(PerformanceReportPdf, {
        reports,
        month: monthLabel,
        labName: tenant?.name ?? "DDT Structure",
      }) as React.ReactElement<any>
    );

    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    );

    return new NextResponse(arrayBuffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="performance-report-${year}-${String(month).padStart(2, "0")}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
