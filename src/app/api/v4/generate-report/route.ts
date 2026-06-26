import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseExcelAnalysis, getOverallResult } from "@/lib/v4/excel-parser";
import { runReportBot, generateRecommendation } from "@/lib/v4/report-engine";
import { generateReportDocx, generateDraftFilename } from "@/lib/v4/docx-writer";
import { RebarMeasurements } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: authUser, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user profile role
    const userProfile = await supabase
      .from("users")
      .select("tenant_id, role")
      .eq("id", authUser.user.id)
      .single();

    if (!userProfile.data) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const { tenant_id: tenantId, role } = userProfile.data;

    // Check permissions (ops_manager+)
    if (role !== "ops_manager" && role !== "lab_owner" && role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Operations Manager or higher role required" }, { status: 403 });
    }

    // Parse form data
    const formData = await req.formData();
    const projectId = formData.get("projectId") as string;
    const concreteGrade = formData.get("concreteGrade") as string || "25";
    const drawingProvided = formData.get("drawingProvided") === "true";
    const rebarDataRaw = formData.get("rebarData") as string;
    const file = formData.get("excelFile") as File;

    if (!projectId || !rebarDataRaw || !file) {
      return NextResponse.json({ error: "Missing required fields: projectId, rebarData, or excelFile" }, { status: 400 });
    }

    // Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx') {
      return NextResponse.json({ error: "Invalid file type: Please upload an Excel file (.xlsx)" }, { status: 400 });
    }

    let rebarData: RebarMeasurements;
    try {
      rebarData = JSON.parse(rebarDataRaw);
    } catch (e) {
      return NextResponse.json({ error: "Invalid rebarData JSON format" }, { status: 400 });
    }

    // Read and parse Excel file
    let parsedExcel;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      parsedExcel = await parseExcelAnalysis(buffer);
    } catch (e: any) {
      console.error("Excel parse error:", e);
      return NextResponse.json({ error: "Could not parse Excel file — please check the format and try again." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Fetch project details
    const { data: project, error: projectError } = await adminClient
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("tenant_id", tenantId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found in this tenant" }, { status: 404 });
    }

    // Fetch site visits with staff names
    const { data: siteVisits } = await adminClient
      .from("site_visits")
      .select("is_team_leader, staff_user:users!site_visits_staff_id_fkey(id, full_name, role)")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId);

    const staffNames = (siteVisits || [])
      .map((sv: any) => {
        const u = sv.staff_user;
        return Array.isArray(u) ? u[0] : u;
      })
      .filter((u): u is { id: string; full_name: string; role: string } => u !== null && u !== undefined);

    // Run report engine
    const overallResult = getOverallResult(parsedExcel);
    const buildingState = (project.connection || '').toUpperCase().includes("CONSTRUCTION") || project.connection === "ONGOING CONSTRUCTION"
      ? "ONGOING CONSTRUCTION"
      : "AN EXISTING BUILDING";

    const recommendationTemplate = generateRecommendation(buildingState, overallResult === 'mixed' ? '[DEFECTS]' : '[NO_DEFECTS]');

    let reportSections;
    try {
      reportSections = await runReportBot({
        projectId,
        ndtCode: project.ndt_code,
        buildingState,
        clientName: project.client_name,
        address: project.address,
        clientEmail: project.client_email,
        clientPhone: project.client_phone,
        siteDate: project.site_date,
        numberOfFloors: project.number_of_floors,
        drawingProvided,
        concreteGrade,
        rebarData,
        excelData: parsedExcel,
        overallResult,
        recommendationTemplate,
      });
    } catch (e: any) {
      console.error("Report engine execution error:", e);
      return NextResponse.json({ error: "Report generation failed — please try again." }, { status: 500 });
    }

    // Generate docx buffer
    let docxBuffer: Buffer;
    try {
      docxBuffer = await generateReportDocx(reportSections, project, staffNames);
    } catch (e: any) {
      console.error("Docx creation error:", e);
      return NextResponse.json({ error: "Failed to assemble Word document." }, { status: 500 });
    }

    // Upload to Storage
    const filename = generateDraftFilename(project.ndt_code);
    const timestamp = Date.now();
    const storagePath = `report-drafts/${tenantId}/${projectId}/${timestamp}_${filename}`;

    const { error: uploadError } = await adminClient.storage
      .from("report-drafts")
      .upload(storagePath, docxBuffer, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload draft report to storage." }, { status: 500 });
    }

    // Create Draft row in DB
    const { data: draftRecord, error: draftError } = await adminClient
      .from("report_drafts")
      .insert({
        project_id: projectId,
        tenant_id: tenantId,
        generated_by: authUser.user.id,
        concrete_grade: concreteGrade,
        drawing_provided: drawingProvided,
        excel_data: parsedExcel as any,
        rebar_data: rebarData as any,
        draft_filename: filename,
        storage_path: storagePath,
        status: "draft_ready",
      })
      .select()
      .single();

    if (draftError || !draftRecord) {
      console.error("DB draft insertion error:", draftError);
      return NextResponse.json({ error: "Failed to save draft record to database." }, { status: 500 });
    }

    // Update parent project status to report_bot_draft
    const { error: projectStatusError } = await adminClient
      .from("projects")
      .update({
        status: "report_bot_draft",
        updated_at: new Date().toISOString()
      })
      .eq("id", projectId);

    if (projectStatusError) {
      console.error("Failed to update project status:", projectStatusError);
    }

    // Add status history
    await adminClient.from("status_history").insert({
      project_id: projectId,
      tenant_id: tenantId,
      from_status: project.status,
      to_status: "report_bot_draft",
      changed_by: authUser.user.id,
      notes: "Report Bot successfully generated draft report.",
    });

    // Send notifications to the staff member assigned to report_writing
    const { data: stageAssignment } = await adminClient
      .from("project_stage_assignments")
      .select("assigned_to")
      .eq("project_id", projectId)
      .eq("stage", "report_writing")
      .single();

    if (stageAssignment?.assigned_to) {
      await adminClient.from("notifications").insert({
        tenant_id: tenantId,
        user_id: stageAssignment.assigned_to,
        type: "task_assigned",
        title: "Report Bot Draft Ready",
        body: `Report Bot has generated a draft report for ${project.ndt_code}. Download it, complete the Visual Inspection section, and re-upload.`,
        related_project_id: projectId,
        is_read: false,
      });
    }

    // Generate signed download URL
    const { data: signedUrlData } = await adminClient.storage
      .from("report-drafts")
      .createSignedUrl(storagePath, 60 * 60); // 1 hour

    return NextResponse.json({
      success: true,
      draftId: draftRecord.id,
      downloadUrl: signedUrlData?.signedUrl || "",
      filename,
      status: "draft_ready"
    });

  } catch (error: any) {
    console.error("API generate-report error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
