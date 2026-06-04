import { SupabaseClient } from "@supabase/supabase-js";

export async function seedSandboxForTenant(
  tenantId: string,
  supabase: SupabaseClient
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return;
  
  const userId = userData.user.id;

  // Create sample project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      tenant_id: tenantId,
      ndt_code: "[SAMPLE]-001",
      client_name: "[Sample] 12-Story Office Complex (Lekki)",
      status: "wip",
      address: "1 Admiralty Way, Lekki Phase 1, Lagos",
      number_of_floors: 12,
      site_date: new Date().toISOString().split("T")[0],
      is_sample: true, // Need to add this column in migration
      created_by: userId,
    })
    .select("id")
    .single();

  if (projectError || !project) {
    console.error("Failed to seed sandbox project:", projectError);
    return;
  }

  const projectId = project.id;

  // Create stage assignments
  const stageAssignments = [
    {
      project_id: projectId,
      tenant_id: tenantId,
      stage_name: "analysis",
      assigned_to: userId,
      status: "in_progress",
    },
    {
      project_id: projectId,
      tenant_id: tenantId,
      stage_name: "sketch",
      assigned_to: null,
      status: "not_started",
    },
    {
      project_id: projectId,
      tenant_id: tenantId,
      stage_name: "report_writing",
      assigned_to: null,
      status: "not_started",
    },
  ];

  await supabase.from("project_stage_assignments").insert(stageAssignments);

  // Create status history
  const historyEntries = [
    {
      project_id: projectId,
      tenant_id: tenantId,
      status: "not_started",
      changed_by: userId,
      notes: "Project registered automatically via sandbox seed.",
    },
    {
      project_id: projectId,
      tenant_id: tenantId,
      status: "wip",
      changed_by: userId,
      notes: "Analysis stage assigned and started.",
    },
  ];

  await supabase.from("project_status_history").insert(historyEntries);
}
