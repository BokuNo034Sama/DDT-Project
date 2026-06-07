import { Resend } from "resend";

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Email not sent:", { to, subject });
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const data = await resend.emails.send({
      from: "DDT Structure <no-reply@ddtstructure.com>", // Configure your verified domain here
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
