import { Resend } from "resend";
import * as React from "react";

export const resend = new Resend(process.env.RESEND_API_KEY);

interface SendWorkspaceEmailParams {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}

export async function sendWorkspaceEmail({
  to,
  subject,
  react,
}: SendWorkspaceEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Email not sent:", { to, subject });
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const data = await resend.emails.send({
      from: "DDT Structure <no-reply@ddtstructure.com>",
      to,
      subject,
      react,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
