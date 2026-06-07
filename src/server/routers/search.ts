import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const searchRouter = router({
  // Full-text search across projects
  projects: managerProcedure
    .input(
      z.object({
        query: z.string().default(""),
        filterType: z
          .enum(["ndt_code", "client_name", "address", "date", "connection"])
          .optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;
      const { query, filterType, dateFrom, dateTo } = input;

      let dbQuery = supabase
        .from("projects")
        .select("*")
        .eq("tenant_id", tenantId);

      if (filterType === "ndt_code") {
        dbQuery = dbQuery.ilike("ndt_code", `%${query}%`);
      } else if (filterType === "client_name") {
        dbQuery = dbQuery.ilike("client_name", `%${query}%`);
      } else if (filterType === "address") {
        dbQuery = dbQuery.ilike("address", `%${query}%`);
      } else if (filterType === "connection") {
        dbQuery = dbQuery.ilike("connection", `%${query}%`);
      } else if (filterType === "date") {
        if (dateFrom && dateTo) {
          dbQuery = dbQuery.gte("site_date", dateFrom).lte("site_date", dateTo);
        } else if (dateFrom) {
          dbQuery = dbQuery.eq("site_date", dateFrom);
        } else if (dateTo) {
          dbQuery = dbQuery.eq("site_date", dateTo);
        }
      } else {
        // Default search: across ndt_code, client_name, and address
        const formatQuery = `%${query}%`;
        dbQuery = dbQuery.or(
          `client_name.ilike.${formatQuery},address.ilike.${formatQuery},ndt_code.ilike.${formatQuery}`
        );
      }

      const { data, error } = await dbQuery
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),
});
