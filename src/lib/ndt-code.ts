import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

/**
 * Generates the next NDT code for a tenant using the database function.
 * Format: {PREFIX}{SERIAL} (e.g., K013)
 */
export async function generateNdtCode(
  tenantId: string,
  supabase: SupabaseClient<Database>
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: nextSerial, error: rpcError } = await (supabase as any).rpc(
    "get_next_serial_number",
    {
      p_tenant_id: tenantId,
    }
  );

  if (rpcError || nextSerial === null) {
    throw rpcError || new Error("Failed to generate serial number");
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (tenantError || !tenant) {
    throw tenantError || new Error("Tenant not found");
  }

  // Explicitly cast to satisfy the compiler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prefix = (tenant as any).code_prefix ?? "K";
  return `${prefix}${String(nextSerial).padStart(3, "0")}`;
}

/**
 * Parses an NDT code into its prefix and serial number.
 */
export function parseNdtCode(code: string) {
  const match = code.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  return {
    prefix: match[1],
    serial: parseInt(match[2], 10),
  };
}
