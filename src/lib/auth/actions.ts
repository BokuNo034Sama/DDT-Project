"use server";

import { createClient } from "@/lib/supabase/server";
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

  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!token || !password || !fullName) {
    return { error: "All fields are required." };
  }

  // 1. Validate token
  const { data: invite, error: inviteError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (inviteError || !invite) {
    return { error: "Invalid or expired invitation token." };
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: "Invitation has expired. Please contact your manager." };
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
  // RLS will allow this if configured, or we'd need service role.
  // For this step, we'll assume the migration allows the user to insert their own record or it's handled via trigger.
  // Actually, the user is authenticated now, but RLS might block if they don't have tenant_id in JWT yet.
  // This is a common hurdle. A DB trigger on auth.users is the best practice.
  
  const { error: userError } = await supabase.from("users").insert({
    id: authUser.user.id,
    tenant_id: invite.tenant_id,
    full_name: fullName,
    email: invite.email,
    role: invite.role,
    joined_at: new Date().toISOString(),
  });

  if (userError) {
    return { error: userError.message };
  }

  // 4. Delete invitation
  await supabase.from("invitations").delete().eq("id", invite.id);

  return { success: true };
}
