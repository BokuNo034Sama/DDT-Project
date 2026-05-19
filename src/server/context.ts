import { createClient } from "@/lib/supabase/server";

export async function createTRPCContext() {
  const supabase = createClient();
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

  // Extract tenantId and role from user app_metadata (Supabase custom claims)
  const tenantId = (user.app_metadata.tenant_id as string) || null;
  const role =
    (user.app_metadata.role as
      | "super_admin"
      | "lab_owner"
      | "ops_manager"
      | "staff") || null;

  return {
    supabase,
    userId: user.id,
    tenantId,
    role,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
