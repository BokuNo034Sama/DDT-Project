import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseDocxComprehensive } from "@/lib/v3/docx-parser";
import { evaluateReport } from "@/lib/v3/ai-engine";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: authUser, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", authUser.user.id)
      .single();

    if (!userProfile.data) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const tenantId = userProfile.data.tenant_id;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file || !projectId) {
      return NextResponse.json({ error: "Missing file or projectId" }, { status: 400 });
    }

    // Insert pending check record
    const { data: checkRecord, error: checkError } = await supabase
      .from("report_checks")
      .insert({
        project_id: projectId,
        tenant_id: tenantId,
        triggered_by: authUser.user.id,
        status: "running",
      })
      .select("id")
      .single();

    if (checkError || !checkRecord) {
      return NextResponse.json({ error: "Failed to create check record" }, { status: 500 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Parse Document
    const parsedDoc = await parseDocxComprehensive(buffer);

    // 2. Run AI Evaluation
    const aiResults = await evaluateReport(
      parsedDoc.rawText,
      parsedDoc.html,
      parsedDoc.tables,
      parsedDoc.imageOcrText
    );

    // Calculate score
    const resultValues = Object.values(aiResults);
    const passedCount = resultValues.filter(r => r.passed).length;
    const overallScore = Math.round((passedCount / resultValues.length) * 100);

    // 3. Save Results
    await supabase
      .from("report_checks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        overall_score: overallScore,
        results_json: aiResults as any,
      })
      .eq("id", checkRecord.id);

    return NextResponse.json({ success: true, checkId: checkRecord.id, score: overallScore, results_json: aiResults });

  } catch (error: any) {
    console.error("V3 Proofread API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
