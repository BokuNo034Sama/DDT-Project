import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import webPush from "web-push";

// Configure Web Push with VAPID credentials
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:operations@ddtstructure.com";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function POST(request: NextRequest) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { error: "VAPID cryptographic keys are not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const bodyData = await request.json();
    const { title, body, tenantId, role, url } = bodyData;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Missing required parameter: tenantId" },
        { status: 400 }
      );
    }

    if (!title || !body) {
      return NextResponse.json(
        { error: "Missing required notification payload fields: title and body" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Query active push subscriptions targeting this tenant
    let query = supabaseAdmin
      .from("user_push_subscriptions")
      .select("id, user_id, tenant_id, endpoint, auth_key, p256dh_key")
      .eq("tenant_id", tenantId);

    // If role parameter is supplied, query specific user roles first to restrict targets
    if (role) {
      const { data: targetUsers, error: usersError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("role", role);

      if (usersError) {
        console.error("Failed to query target users by role:", usersError);
        return NextResponse.json(
          { error: "Database lookup failed for targeted role." },
          { status: 500 }
        );
      }

      if (!targetUsers || targetUsers.length === 0) {
        return NextResponse.json({
          success: true,
          total: 0,
          sent: 0,
          failed: 0,
          purged: 0,
          message: "No users match the targeted team role filter."
        });
      }

      const userIds = targetUsers.map((u) => u.id);
      query = query.in("user_id", userIds);
    }

    const { data: subscriptions, error: dbError } = await query;

    if (dbError) {
      console.error("Database query failed for push subscriptions:", dbError);
      return NextResponse.json(
        { error: "Database retrieval of subscriptions failed." },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        sent: 0,
        failed: 0,
        purged: 0,
        message: "No push subscriptions registered for target filters."
      });
    }

    // Build notification payload
    const payloadString = JSON.stringify({
      title,
      body,
      url: url || "/",
      tag: role ? `broadcast-${role}` : "broadcast-general"
    });

    // Execute concurrently using Promise.allSettled to ensure failure on individual endpoints
    // does not block delivery to other devices
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          }
        };

        try {
          await webPush.sendNotification(pushSubscription, payloadString);
          return { success: true, endpoint: sub.endpoint, purged: false };
        } catch (err: any) {
          console.warn(`Web push dispatch failed to endpoint: ${sub.endpoint}`, err);

          // Purge stale endpoints (410 Gone or 404 Not Found)
          if (err.statusCode === 410 || err.statusCode === 404) {
            const { error: deleteError } = await supabaseAdmin
              .from("user_push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);

            if (deleteError) {
              console.error(`Failed to purge stale push subscription endpoint: ${sub.endpoint}`, deleteError);
            } else {
              console.log(`Successfully purged stale push subscription endpoint: ${sub.endpoint}`);
            }

            return { success: false, endpoint: sub.endpoint, purged: true };
          }

          // Otherwise return standard failed result
          return { success: false, endpoint: sub.endpoint, purged: false };
        }
      })
    );

    // Sum details from the execution batch
    let sentCount = 0;
    let failedCount = 0;
    let purgedCount = 0;

    results.forEach((res) => {
      if (res.status === "fulfilled") {
        const val = res.value;
        if (val.success) {
          sentCount++;
        } else {
          failedCount++;
          if (val.purged) {
            purgedCount++;
          }
        }
      } else {
        failedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      total: subscriptions.length,
      sent: sentCount,
      failed: failedCount,
      purged: purgedCount
    });

  } catch (err: any) {
    console.error("General error in push broadcast handler:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process push broadcast request." },
      { status: 500 }
    );
  }
}
