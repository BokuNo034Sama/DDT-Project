import { createClient } from "@/lib/supabase/server";

export async function createTRPCContext() {
  const supabase = createClient();
  
  // 1. Use getUser() to securely ping the Supabase Auth server (Fixes the warning)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      userId: null,
      tenantId: null,
      role: null,
    };
  }

  // 2. Fetch the absolute source of truth directly from your database
  // This completely bypasses all cookie caching and JWT hook issues!
  const { data: profile } = await supabase
    .from("users")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single();

  return {
    supabase,
    userId: user.id,
    userEmail: user.email || null,
    tenantId: profile?.tenant_id || null,
    role: (profile?.role as "super_admin" | "lab_owner" | "ops_manager" | "staff") || null,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
