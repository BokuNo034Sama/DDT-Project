import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { calculateEfficiencyScore } from "../utils/efficiency";
import { createAdminClient } from "@/lib/supabase/admin";

export const projectsRouter = router({
  // Get paginated projects for the user's tenant
  list: managerProcedure
    .input(z.object({
      status: z.enum([
        'not_started', 'wip', 'analysis_done',
        'sketch_done', 'report_done', 'proof_ready',
        'report_uploaded', 'report_verified',
        'report_delivered', 'report_bot_draft'
      ]).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const adminClient = createAdminClient()

      // Get tenant_id from users table
      const { data: user } = await adminClient
        .from('users')
        .select('tenant_id')
        .eq('id', ctx.userId)
        .single()

      let query = adminClient
        .from('projects')
        .select(`
          *,
          project_stage_assignments (
            id, stage, status, started_at, completed_at,
            assigned_to,
            assigned_user:users!project_stage_assignments_assigned_to_fkey (
              id, full_name
            )
          )
        `, { count: 'exact' })
        .eq('tenant_id', user?.tenant_id)
        .order('created_at', { ascending: false })

      // Apply status filter ONLY if provided
      if (input.status) {
        query = query.eq('status', input.status)
      }

      // Pagination
      const from = (input.page - 1) * input.limit
      const to = from + input.limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        })
      }

      return {
        projects: data || [],
        total: count || 0,
        page: input.page,
        totalPages: Math.ceil((count || 0) / input.limit)
      }
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
          "report_bot_draft",
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

  updateLsmtlStatus: managerProcedure
    .input(z.object({
      projectId: z.string(),
      lsmtlStatus: z.enum([
        'pending',
        'report_rejected',
        'mismatched_report',
        'report_collected'
      ])
    }))
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient()

      const { data: user } = await adminClient
        .from('users')
        .select('tenant_id')
        .eq('id', ctx.userId)
        .single()

      // Update LSMTL status
      const { error } = await adminClient
        .from('projects')
        .update({
          lsmtl_status: input.lsmtlStatus,
          // If collected → also update project status
          ...(input.lsmtlStatus === 'report_collected'
            ? { status: 'report_delivered' }
            : {})
        })
        .eq('id', input.projectId)
        .eq('tenant_id', user?.tenant_id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        })
      }

      // Log status history if delivered
      if (input.lsmtlStatus === 'report_collected') {
        await adminClient
          .from('status_history')
          .insert({
            project_id: input.projectId,
            tenant_id: user?.tenant_id,
            from_status: 'report_verified',
            to_status: 'report_delivered',
            changed_by: ctx.userId,
            notes: 'Report collected from LSMTL portal'
          })

        // Query lab owner(s) to notify
        const { data: labOwners } = await adminClient
          .from('users')
          .select('id')
          .eq('tenant_id', user?.tenant_id)
          .eq('role', 'lab_owner')

        const { data: project } = await adminClient
          .from('projects')
          .select('ndt_code, client_name')
          .eq('id', input.projectId)
          .single()

        const ndtCode = project?.ndt_code || ''
        const clientName = project?.client_name || ''

        if (labOwners && labOwners.length > 0) {
          const { sendNotification } = await import("@/lib/notifications/send");
          for (const owner of labOwners) {
            try {
              await sendNotification({
                supabase: adminClient,
                tenantId: user?.tenant_id!,
                userId: owner.id,
                type: 'report_delivered',
                title: 'Project Complete',
                message: `${ndtCode} — ${clientName} has been marked as delivered. Project complete.`,
                link: `/projects/${input.projectId}`
              });
            } catch (e) {
              console.error("Error sending notification via helper:", e);
              // Direct insert fallback
              await adminClient.from('notifications').insert({
                tenant_id: user?.tenant_id!,
                user_id: owner.id,
                type: 'report_delivered',
                title: 'Project Complete',
                body: `${ndtCode} — ${clientName} has been marked as delivered. Project complete.`,
                related_project_id: input.projectId,
                is_read: false
              });
            }
          }
        }
      }

      return { success: true }
    }),

  delete: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adminClient = createAdminClient()

      // Verify project belongs to this tenant
      const { data: project } = await adminClient
        .from('projects')
        .select('id, tenant_id, ndt_code')
        .eq('id', input.id)
        .single()

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found'
        })
      }

      // Verify tenant ownership
      const { data: user } = await adminClient
        .from('users')
        .select('tenant_id')
        .eq('id', ctx.userId)
        .single()

      if (project.tenant_id !== user?.tenant_id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this project'
        })
      }

      console.log('Attempting to delete project:', input.id)
      const { error, data } = await adminClient
        .from('projects')
        .delete()
        .eq('id', input.id)
        .select()  // Add .select() to confirm what was deleted
      console.log('Delete result:', { error, data })

      if (error) {
        console.error('Delete error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete project: ' + error.message
        })
      }

      return { success: true, deletedId: input.id }
    }),
});


