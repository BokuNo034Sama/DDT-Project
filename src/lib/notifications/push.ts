import { createAdminClient } from "@/lib/supabase/admin";
import webPush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:operations@ddtstructure.com";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface SendPushParams {
  userId: string;
  tenantId: string;
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotification({
  userId,
  tenantId,
  title,
  body,
  url = "/",
}: SendPushParams) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured. Skipping push notification.");
    return { success: false, error: "VAPID keys not configured" };
  }

  const supabaseAdmin = createAdminClient();

  // Query subscriptions for this user in this tenant
  const { data: subscriptions, error } = await supabaseAdmin
    .from("user_push_subscriptions")
    .select("endpoint, auth_key, p256dh_key")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("Failed to fetch push subscriptions:", error);
    return { success: false, error };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { success: true, sent: 0, message: "No subscriptions found" };
  }

  const payloadString = JSON.stringify({
    title,
    body,
    url,
    tag: "site-visit-instruction",
  });

  let sentCount = 0;
  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh_key,
        auth: sub.auth_key,
      },
    };

    try {
      await webPush.sendNotification(pushSubscription, payloadString);
      sentCount++;
    } catch (err: any) {
      console.warn(`Failed to send push notification to endpoint ${sub.endpoint}:`, err);
      // Purge stale subscription if 410 or 404
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabaseAdmin
          .from("user_push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
    }
  }

  return { success: true, sent: sentCount };
}
