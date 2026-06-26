import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: authUser, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { draftId } = await req.json();

    if (!draftId) {
      return NextResponse.json({ error: "Missing draftId" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check that user profile belongs to the tenant of the draft
    const userProfile = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", authUser.user.id)
      .single();

    if (!userProfile.data) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Fetch draft metadata
    const { data: draft, error: draftError } = await adminClient
      .from("report_drafts")
      .select("storage_path, draft_filename, tenant_id")
      .eq("id", draftId)
      .single();

    if (draftError || !draft) {
      return NextResponse.json({ error: "Draft report not found" }, { status: 404 });
    }

    if (draft.tenant_id !== userProfile.data.tenant_id) {
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    if (!draft.storage_path || !draft.draft_filename) {
      return NextResponse.json({ error: "File storage information is missing" }, { status: 500 });
    }

    // Download document from storage
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("report-drafts")
      .download(draft.storage_path);

    if (downloadError || !fileData) {
      console.error("Storage download error:", downloadError);
      return NextResponse.json({ error: "Failed to download draft document from storage" }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${draft.draft_filename}"`,
      },
    });

  } catch (error: any) {
    console.error("API download-draft error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
export async function GET(req: NextRequest) {
  // Support GET by parsing draftId from query params
  try {
    const supabase = createClient();
    const { data: authUser, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get("draftId");

    if (!draftId) {
      return NextResponse.json({ error: "Missing draftId" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const userProfile = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", authUser.user.id)
      .single();

    if (!userProfile.data) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const { data: draft, error: draftError } = await adminClient
      .from("report_drafts")
      .select("storage_path, draft_filename, tenant_id")
      .eq("id", draftId)
      .single();

    if (draftError || !draft) {
      return NextResponse.json({ error: "Draft report not found" }, { status: 404 });
    }

    if (draft.tenant_id !== userProfile.data.tenant_id) {
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    if (!draft.storage_path || !draft.draft_filename) {
      return NextResponse.json({ error: "File storage information is missing" }, { status: 500 });
    }

    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("report-drafts")
      .download(draft.storage_path);

    if (downloadError || !fileData) {
      console.error("Storage download error:", downloadError);
      return NextResponse.json({ error: "Failed to download draft document from storage" }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${draft.draft_filename}"`,
      },
    });

  } catch (error: any) {
    console.error("API download-draft GET error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
