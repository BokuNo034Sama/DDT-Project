import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey === "" || secretKey.startsWith("sk_test_placeholder")) {
    return NextResponse.json({ error: "Webhook signature verification ignored in simulation mode" }, { status: 400 });
  }

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature header" }, { status: 401 });
    }

    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    if (payload.event === "charge.success") {
      const tenantId = payload.data?.metadata?.tenantId;

      if (!tenantId) {
        return NextResponse.json({ error: "Missing tenant metadata" }, { status: 400 });
      }

      const supabaseAdmin = createAdminClient();
      const { error } = await supabaseAdmin
        .from("tenants")
        .update({
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tenantId);

      if (error) {
        console.error("Database update error during billing webhook:", error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Paystack webhook error:", err);
    return NextResponse.json({ error: err.message || "Webhook processing error" }, { status: 500 });
  }
}
