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

    const adminClient = createAdminClient();

    const { data: user } = await adminClient
      .from("users")
      .select("tenant_id")
      .eq("id", authUser.user.id)
      .single();

    if (!user?.tenant_id) {
      return NextResponse.json({ error: "User tenant not found" }, { status: 404 });
    }

    const tenantId = user.tenant_id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields: file and projectId are required." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const storagePath = `completed-drafts/${tenantId}/${projectId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await adminClient.storage
      .from("report-drafts")
      .upload(storagePath, buffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload completed draft:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, storagePath });
  } catch (error: any) {
    console.error("API submit-completed-draft error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
