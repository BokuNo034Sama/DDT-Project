import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const projectsRouter = router({
  // Get paginated projects for the user's tenant
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().default(0), // page offset
        status: z.enum([
          "not_started",
          "wip",
          "analysis_done",
          "sketch_done",
          "report_done",
          "proof_ready",
          "report_uploaded",
          "report_verified",
          "report_delivered",
        ]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;
      let query = supabase
        .from("projects")
        .select("*", { count: "exact" })
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .range(input.cursor, input.cursor + input.limit - 1);

      if (input.status) {
        query = query.eq("status", input.status);
      }

      const { data, count, error } = await query;
      
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return {
        items: data,
        nextCursor: data.length === input.limit ? input.cursor + input.limit : undefined,
        totalCount: count,
      };
    }),

  // Get full project detail
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select(`
          *,
          project_stage_assignments (
            *,
            assigned_user:users!project_stage_assignments_assigned_to_fkey (id, full_name, role)
          ),
          site_visits (
            *,
            staff_user:users!site_visits_staff_id_fkey (id, full_name, role)
          ),
          proof_reviews (
            *,
            reviewer_user:users!proof_reviews_reviewed_by_fkey (id, full_name, role)
          ),
          status_history (
            *,
            changed_by_user:users!status_history_changed_by_fkey (id, full_name, role)
          )
        `)
        .eq("id", input.id)
        .eq("tenant_id", tenantId)
        .single();

      if (projectError) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      return project;
    }),

  // Create new project
  create: managerProcedure
    .input(
      z.object({
        client_name: z.string().min(1),
        client_email: z.string().email().optional().or(z.literal("")),
        client_phone: z.string().optional().or(z.literal("")),
        address: z.string().min(1),
        number_of_floors: z.number().min(0),
        connection: z.string().optional().or(z.literal("")),
        site_date: z.string(), // ISO date string
        device: z.string().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId, userId } = ctx;

      // Call RPC function to get the next NDT code safely avoiding race conditions
      const { data: serial_number, error: rpcError } = await supabase.rpc("get_next_serial_number", {
        p_tenant_id: tenantId,
      });

      if (rpcError || serial_number === null) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not generate NDT code" });
      }

      // Format NDT Code
      const { data: tenant } = await supabase.from("tenants").select("code_prefix").eq("id", tenantId).single();
      const prefix = tenant?.code_prefix ?? "K";
      const ndt_code = `${prefix}${String(serial_number).padStart(3, "0")}`;

      const { data: project, error: createError } = await supabase
        .from("projects")
        .insert({
          tenant_id: tenantId,
          created_by: userId,
          ndt_code,
          serial_number,
          client_name: input.client_name,
          client_email: input.client_email || null,
          client_phone: input.client_phone || null,
          address: input.address,
          number_of_floors: input.number_of_floors,
          connection: input.connection || null,
          site_date: input.site_date,
          device: input.device || null,
          status: "not_started",
        })
        .select()
        .single();

      if (createError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: createError.message });
      }

      // Log status history creation
      await supabase.from("status_history").insert({
        project_id: project.id,
        tenant_id: tenantId,
        from_status: null,
        to_status: "not_started",
        changed_by: userId,
        notes: "Project created",
      });

      return project;
    }),

  // Manual status override
  updateStatus: managerProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        status: z.enum([
          "not_started",
          "wip",
          "analysis_done",
          "sketch_done",
          "report_done",
          "proof_ready",
          "report_uploaded",
          "report_verified",
          "report_delivered",
        ]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId, userId } = ctx;

      // Get current status
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("status")
        .eq("id", input.projectId)
        .eq("tenant_id", tenantId)
        .single();

      if (projectError || !project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      if (project.status === input.status) {
        return { success: true }; // Nothing to change
      }

      const { error: updateError } = await supabase
        .from("projects")
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq("id", input.projectId)
        .eq("tenant_id", tenantId);

      if (updateError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: updateError.message });
      }

      // Log to history
      await supabase.from("status_history").insert({
        project_id: input.projectId,
        tenant_id: tenantId,
        from_status: project.status,
        to_status: input.status,
        changed_by: userId,
        notes: input.notes || "Manual status override",
      });

      return { success: true };
    }),

  // Edit existing project details
  update: managerProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        client_name: z.string().min(1),
        client_email: z.string().email().optional().or(z.literal("")),
        client_phone: z.string().optional().or(z.literal("")),
        address: z.string().min(1),
        number_of_floors: z.number().min(0),
        connection: z.string().optional().or(z.literal("")),
        site_date: z.string(), // ISO date string
        device: z.string().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;
      const { id, ...data } = input;
      const { data: updated, error } = await supabase
        .from("projects")
        .update({
          client_name: data.client_name,
          client_email: data.client_email || null,
          client_phone: data.client_phone || null,
          address: data.address,
          number_of_floors: data.number_of_floors,
          connection: data.connection || null,
          site_date: data.site_date,
          device: data.device || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return updated;
    }),
});

