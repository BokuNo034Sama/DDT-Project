import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Prevent crashing during build if env vars are placeholders or missing
  if (!url || !url.startsWith("http") || !key) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {} as any;
  }

  return createBrowserClient(url, key);
}
