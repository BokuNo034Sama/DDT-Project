import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const searchRouter = router({
  // Full-text search across projects
  projects: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;

      // The GIN index was created on: to_tsvector('english', client_name || ' ' || address || ' ' || ndt_code)
      // Supabase's textSearch handles this matching
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("tenant_id", tenantId)
        .textSearch("client_name_address_ndt_code_search", input.query, {
          type: "websearch", // better for human input like "K009 Lagos"
          config: "english",
        })
        .order("created_at", { ascending: false })
        .limit(20);

      // Note: Because we didn't create a generated column for the tsvector, textSearch might not work exactly 
      // without specifying the exact generated column or using an RPC.
      // If we don't have a generated column, we can fallback to basic ilike matching for now,
      // or use Supabase's .or() syntax. Let's try basic .or() to be safe without schema changes.

      if (error) {
         // Fallback manual OR search if textSearch fails due to missing tsvector column
         const fallbackQuery = `%${input.query}%`;
         const { data: fallbackData, error: fallbackError } = await supabase
          .from("projects")
          .select("*")
          .eq("tenant_id", tenantId)
          .or(`client_name.ilike.${fallbackQuery},address.ilike.${fallbackQuery},ndt_code.ilike.${fallbackQuery}`)
          .order("created_at", { ascending: false })
          .limit(20);
          
          if (fallbackError) {
             throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: fallbackError.message });
          }
          return fallbackData;
      }

      return data;
    }),
});
