import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { calculateEfficiencyScore } from "../utils/efficiency";
import { createAdminClient } from "@/lib/supabase/admin";

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
      const adminClient = createAdminClient();
      const profile = await adminClient
        .from("users")
        .select("tenant_id")
        .eq("id", ctx.userId)
        .single();

      const activeTenantId = profile.data?.tenant_id || ctx.tenantId;

      const { data: project, error: projectError } = await adminClient
        .from("projects")
        .select(`
          *,
          project_stage_assignments (
            *,
            assigned_user:users!project_stage_assignments_assigned_to_fkey (
              full_name
            )
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
        .eq("tenant_id", activeTenantId)
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
      const { supabase, tenantId, role } = ctx;
      const { id, ...data } = input;

      // If user is staff, they can only edit client_email, client_phone, device, and connection.
      if (role === "staff") {
        const { data: existing, error: fetchError } = await supabase
          .from("projects")
          .select("client_name, address, number_of_floors, site_date")
          .eq("id", id)
          .eq("tenant_id", tenantId)
          .single();

        if (fetchError || !existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }

        // Compare dates in MS to ensure they represent the same day
        const existingTime = new Date(existing.site_date).getTime();
        const inputTime = new Date(data.site_date).getTime();

        if (
          existing.client_name !== data.client_name ||
          existing.address !== data.address ||
          existing.number_of_floors !== data.number_of_floors ||
          existingTime !== inputTime
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Staff are not allowed to edit core project details." });
        }
      }

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

  // Dashboard summary data
  getDashboardData: managerProcedure.query(async ({ ctx }) => {
    const adminClient = createAdminClient();

    // Resolve the database-level tenant configuration directly to bypass session/JWT sync constraints
    const profile = await adminClient
      .from("users")
      .select("tenant_id")
      .eq("id", ctx.userId)
      .single();

    const activeTenantId = profile.data?.tenant_id || ctx.tenantId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const [
      activeRes,
      awaitingRes,
      completedRes,
      recentRes,
      assignmentsRes,
    ] = await Promise.all([
      adminClient
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", activeTenantId)
        .not("status", "in", '("report_delivered","report_verified")'),
      adminClient
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", activeTenantId)
        .eq("status", "report_done"),
      adminClient
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", activeTenantId)
        .eq("status", "report_delivered")
        .gte("updated_at", startOfMonth)
        .lte("updated_at", endOfMonth),
      adminClient
        .from("projects")
        .select("id, ndt_code, client_name, address, status, site_date, created_at")
        .eq("tenant_id", activeTenantId)
        .not("status", "in", '("report_delivered","report_verified")')
        .order("created_at", { ascending: false })
        .limit(20),
      adminClient
        .from("project_stage_assignments")
        .select(`
          *,
          project:projects(id, ndt_code, client_name, status),
          assigned_user:users!project_stage_assignments_assigned_to_fkey(id, full_name, role)
        `, { count: "exact" })
        .eq("tenant_id", activeTenantId)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .limit(10),
    ]);

    return {
      activeCount: activeRes.error ? 0 : (activeRes.count ?? 0),
      staffOnTask: assignmentsRes.error ? 0 : (assignmentsRes.count ?? 0),
      awaitingProofread: awaitingRes.error ? 0 : (awaitingRes.count ?? 0),
      deliveredThisMonth: completedRes.error ? 0 : (completedRes.count ?? 0),
      activeProjects: recentRes.error ? [] : (recentRes.data ?? []),
      activeAssignments: assignmentsRes.error ? [] : (assignmentsRes.data ?? []),
    };
  }),

  getOnboardingStatus: managerProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx;
    const adminClient = createAdminClient();

    const profile = await adminClient
      .from("users")
      .select("tenant_id")
      .eq("id", ctx.userId)
      .single();

    const activeTenantId = profile.data?.tenant_id;

    const [staffCount, projectCount, proofReviewCount] = await Promise.all([
      adminClient
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", activeTenantId)
        .eq("role", "staff")
        .eq("is_active", true),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", activeTenantId),
      supabase
        .from("proof_reviews")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", activeTenantId),
    ]);

    return {
      staffCount: staffCount.error ? 0 : (staffCount.count ?? 0),
      projectCount: projectCount.error ? 0 : (projectCount.count ?? 0),
      proofReviewCount: proofReviewCount.error ? 0 : (proofReviewCount.count ?? 0),
    };
  }),

  getDashboardList: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, tenantId } = ctx;
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
    return data;
  }),

  deleteProject: managerProcedure
    .input(
      z.object({
        id: z.string().min(1, "Project ID is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { supabase, tenantId } = ctx;

      console.log(`[DEBUG DELETION] Initiating purge for Project: ${id} under Tenant: ${tenantId}`);

      try {
        // 1. Double-check item existence & tenant matching before executing drops
        const { data: existingProject, error: checkError } = await supabase
          .from("projects")
          .select("id")
          .eq("id", id)
          .eq("tenant_id", tenantId)
          .maybeSingle();

        if (checkError || !existingProject) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Project not found or access denied for ID: ${id}`,
          });
        }

        // 2. Cascade manual cleanup of child dependencies to clear foreign key blockers
        const { error: err1 } = await supabase
          .from("project_stage_assignments")
          .delete()
          .eq("project_id", id)
          .eq("tenant_id", tenantId);
        if (err1) throw err1;

        const { error: err2 } = await supabase
          .from("status_history")
          .delete()
          .eq("project_id", id)
          .eq("tenant_id", tenantId);
        if (err2) throw err2;

        const { error: err3 } = await supabase
          .from("site_visit_logs")
          .delete()
          .eq("project_id", id)
          .eq("tenant_id", tenantId);
        if (err3) throw err3;

        const { error: err4 } = await supabase
          .from("site_visits")
          .delete()
          .eq("project_id", id)
          .eq("tenant_id", tenantId);
        if (err4) throw err4;

        const { error: err5 } = await supabase
          .from("proof_reviews")
          .delete()
          .eq("project_id", id)
          .eq("tenant_id", tenantId);
        if (err5) throw err5;

        const { error: err6 } = await supabase
          .from("report_checks")
          .delete()
          .eq("project_id", id)
          .eq("tenant_id", tenantId);
        if (err6) throw err6;

        const { error: err7 } = await supabase
          .from("notifications")
          .delete()
          .eq("related_project_id", id)
          .eq("tenant_id", tenantId);
        if (err7) throw err7;

        // 3. Purge the parent project row
        const { data: deletedProject, error: deleteError } = await supabase
          .from("projects")
          .delete()
          .eq("id", id)
          .eq("tenant_id", tenantId)
          .select("id")
          .single();

        if (deleteError) {
          throw deleteError;
        }

        console.log(`[DEBUG DELETION] Successfully removed project from DB:`, deletedProject.id);
        return { success: true, deletedId: deletedProject.id };

      } catch (error: any) {
        console.error("[CRITICAL DELETION FAILURE BT]:", error);
        
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Database block: ${error.message || "Foreign key constraint failure."}`,
          cause: error,
        });
      }
    }),
});

