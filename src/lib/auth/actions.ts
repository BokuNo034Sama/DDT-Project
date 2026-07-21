"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { seedSandboxForTenant } from "@/lib/onboarding/seed-sandbox";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function acceptInvite(formData: FormData) {
  const supabase = createClient();
  const adminClient = createAdminClient();

  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!token || !password || !fullName) {
    return { error: "All fields are required." };
  }

  // 1. Validate token
  console.log("Looking up token:", token);
  const { data: invite, error: inviteError } = await adminClient
    .from("invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  console.log("Query result:", invite, inviteError);

  if (inviteError || !invite) {
    return { error: "Invalid or expired invitation token." };
  }

  // 2. Create Supabase Auth user
  // Using signUp. Depending on Supabase settings, this might send another email.
  // In a production app, you'd likely use the admin API to create the user and set password.
  const { data: authUser, error: authError } = await supabase.auth.signUp({
    email: invite.email,
    password: password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError || !authUser.user) {
    return { error: authError?.message || "Failed to create account." };
  }

  // 3. Create public users record
  const { error: userError } = await adminClient.from("users").insert({
    id: authUser.user.id,
    tenant_id: invite.tenant_id,
    full_name: fullName,
    email: invite.email,
    role: invite.role,
    is_active: true,
    joined_at: new Date().toISOString(),
  });

  if (userError) {
    return { error: userError.message };
  }

  // 4. Delete invitation
  await supabase.from("invitations").delete().eq("id", invite.id);

  return { success: true };
}

export async function initializeTenant(labName: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to initialize a workspace." };
  }

  // Use Admin client to bypass RLS since user doesn't have a tenant yet
  const adminClient = createAdminClient();

  // Check if user already exists
  const { data: existingUser } = await adminClient
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existingUser) {
    return { success: true }; // Already initialized
  }

  const slug = labName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const { data: tenant, error: tenantError } = await adminClient
    .from("tenants")
    .insert({
      name: labName,
      slug: slug,
      subscription_status: "trial",
      code_prefix: "TEMP",
    })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    return { error: tenantError?.message || "Failed to create tenant" };
  }

  const { error: userError } = await adminClient.from("users").insert({
    id: user.id,
    tenant_id: tenant.id,
    full_name: user.user_metadata?.full_name || "Lab Owner",
    email: user.email!,
    role: "lab_owner",
    joined_at: new Date().toISOString(),
  });

  if (userError) {
    return { error: userError.message };
  }

  // Seed Sandbox for the new tenant
  await seedSandboxForTenant(tenant.id, adminClient);

  return { success: true };
}

// Send password reset email
export async function sendPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://ddtstructure.com").replace(/\/$/, "");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/reset-password`,
  });

  // Always return success — do not reveal if
  // email exists (security best practice)
  if (error) {
    console.error("Reset email error:", error);
  }

  return { success: true };
}

// Update password after reset
export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

