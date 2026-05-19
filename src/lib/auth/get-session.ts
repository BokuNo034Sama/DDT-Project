import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { ProfileWithTenant } from "@/types";
import { User as AuthUser } from "@supabase/supabase-js";

/**
 * Server-side helper to get the current session and user profile.
 * Cached to prevent multiple DB calls in a single request.
 */
export const getSession = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch the user record from the public users table with tenant info
  const { data: profile } = await supabase
    .from("users")
    .select("*, tenants(*)")
    .eq("id", user.id)
    .single();

  return {
    user,
    profile: profile
      ? ({
          ...profile,
          tenant: Array.isArray(profile.tenants)
            ? profile.tenants[0]
            : profile.tenants,
        } as ProfileWithTenant)
      : null,
  } as { user: AuthUser; profile: ProfileWithTenant | null };
});
