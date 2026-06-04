import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  const origin = new URL(request.url).origin;

  if (!reference) {
    return NextResponse.redirect(`${origin}/settings?billing=error&reason=no_reference`);
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey === "" || secretKey.startsWith("sk_test_placeholder")) {
    return NextResponse.redirect(`${origin}/settings?billing=error&reason=simulation_bypass`);
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status || data.data.status !== "success") {
      return NextResponse.redirect(
        `${origin}/settings?billing=error&reason=${encodeURIComponent(data.message || "failed_verification")}`
      );
    }

    // Extract tenantId from metadata
    const tenantId = data.data.metadata?.tenantId;

    if (!tenantId) {
      return NextResponse.redirect(
        `${origin}/settings?billing=error&reason=missing_tenant_metadata`
      );
    }

    // Update subscription_status to active
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from("tenants")
      .update({
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    if (error) {
      console.error("Database update error during billing callback:", error);
      return NextResponse.redirect(
        `${origin}/settings?billing=error&reason=database_update_failed`
      );
    }

    return NextResponse.redirect(`${origin}/settings?billing=success`);
  } catch (err: any) {
    console.error("Paystack verification exception:", err);
    return NextResponse.redirect(
      `${origin}/settings?billing=error&reason=${encodeURIComponent(err.message || "exception")}`
    );
  }
}
