import { createClient } from "@/lib/supabase/server";

export async function createTRPCContext() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      supabase,
      userId: null,
      tenantId: null,
      role: null,
    };
  }

  // Decode JWT to get custom claims added by our database hook
  const jwt = JSON.parse(
    Buffer.from(session.access_token.split(".")[1], "base64").toString()
  );

  const role =
    (jwt.role as
      | "super_admin"
      | "lab_owner"
      | "ops_manager"
      | "staff") || null;
      
  const tenantId = (jwt.tenant_id as string) || null;

  return {
    supabase,
    userId: session.user.id,
    tenantId,
    role,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
