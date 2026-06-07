import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { sendWorkspaceEmail } from "@/lib/resend";
import { NotificationEmail } from "../email/templates/notification";
import React from "react";

type NotificationType = Database["public"]["Enums"]["notification_type_enum"];

interface SendNotificationParams {
  supabase: any; // Using any bypasses strict and brittle PostgREST table generic inferences
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  sendEmailAlert?: boolean;
}

export async function sendNotification({
  supabase,
  tenantId,
  userId,
  type,
  title,
  message,
  link,
  sendEmailAlert = false,
}: SendNotificationParams) {
  // 1. Create in-app notification using correct schema columns: body, related_project_id, is_read
  const { error } = await supabase.from("notifications").insert({
    tenant_id: tenantId,
    user_id: userId,
    type,
    title,
    body: message,
    related_project_id: link || null,
    is_read: false,
  } as any);

  if (error) {
    console.error("Failed to create notification:", error);
    return { success: false, error };
  }

  // 2. Optionally send email if requested and type matches
  if (sendEmailAlert && (type === "task_assigned" || type === "proof_failed")) {
    // Get user email
    const { data: user } = (await supabase.from("users").select("email").eq("id", userId).single()) as any;
    const { data: tenant } = (await supabase.from("tenants").select("name").eq("id", tenantId).single()) as any;
    if (user?.email && tenant?.name) {
      await sendWorkspaceEmail({
        to: user.email,
        subject: `${title} - DDT Structure`,
        react: React.createElement(NotificationEmail, {
          labName: tenant.name,
          type,
          title,
          message,
          actionUrl: link ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${link}` : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
          actionText: type === "task_assigned" ? "View Task" : "View Details",
        }),
      });
    }
  }

  return { success: true };
}
