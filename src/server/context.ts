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

  // Decode JWT to hunt down the custom claims
  const jwt = JSON.parse(
    Buffer.from(session.access_token.split(".")[1], "base64").toString()
  );

  // Check all possible locations where Supabase might place your hook data
  const rawRole = 
    jwt.app_metadata?.role || 
    jwt.user_metadata?.role || 
    (jwt.role !== "authenticated" ? jwt.role : null);

  const rawTenantId = 
    jwt.app_metadata?.tenant_id || 
    jwt.tenant_id || 
    null;

  const role =
    (rawRole as
      | "super_admin"
      | "lab_owner"
      | "ops_manager"
      | "staff") || null;
      
  const tenantId = (rawTenantId as string) || null;

  // Logging this so we can see the exact token contents in Vercel if it fails
  console.log("=== BACKEND AUTH CHECK ===");
  console.log("Final Extracted Role:", role);
  console.log("Final Extracted Tenant:", tenantId);

  return {
    supabase,
    userId: session.user.id,
    tenantId,
    role,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
