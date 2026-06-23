export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          subscription_status: "trial" | "active" | "inactive" | null;
          code_prefix: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          subscription_status?: "trial" | "active" | "inactive" | null;
          code_prefix?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          subscription_status?: "trial" | "active" | "inactive" | null;
          code_prefix?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          full_name: string;
          email: string;
          role: "super_admin" | "lab_owner" | "ops_manager" | "staff";
          is_active: boolean;
          invited_by: string | null;
          joined_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          full_name: string;
          email: string;
          role: "super_admin" | "lab_owner" | "ops_manager" | "staff";
          is_active?: boolean;
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          full_name?: string;
          email?: string;
          role?: "super_admin" | "lab_owner" | "ops_manager" | "staff";
          is_active?: boolean;
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          tenant_id: string;
          ndt_code: string;
          serial_number: number;
          client_name: string;
          client_email: string | null;
          client_phone: string | null;
          address: string;
          number_of_floors: number;
          connection: string | null;
          site_date: string;
          device: string | null;
          status:
            | "not_started"
            | "wip"
            | "analysis_done"
            | "sketch_done"
            | "report_done"
            | "proof_ready"
            | "report_uploaded"
            | "report_verified"
            | "report_delivered"
            | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          ndt_code: string;
          serial_number: number;
          client_name: string;
          client_email?: string | null;
          client_phone?: string | null;
          address: string;
          number_of_floors: number;
          connection?: string | null;
          site_date: string;
          device?: string | null;
          status?:
            | "not_started"
            | "wip"
            | "analysis_done"
            | "sketch_done"
            | "report_done"
            | "proof_ready"
            | "report_uploaded"
            | "report_verified"
            | "report_delivered"
            | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          ndt_code?: string;
          serial_number?: number;
          client_name?: string;
          client_email?: string | null;
          client_phone?: string | null;
          address?: string;
          number_of_floors?: number;
          connection?: string | null;
          site_date?: string;
          device?: string | null;
          status?:
            | "not_started"
            | "wip"
            | "analysis_done"
            | "sketch_done"
            | "report_done"
            | "proof_ready"
            | "report_uploaded"
            | "report_verified"
            | "report_delivered"
            | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_stage_assignments: {
        Row: {
          id: string;
          project_id: string;
          tenant_id: string;
          stage: "analysis" | "sketch" | "report_writing" | "proofreading";
          assigned_to: string | null;
          assigned_by: string;
          assigned_at: string;
          started_at: string | null;
          completed_at: string | null;
          status: "pending" | "in_progress" | "completed" | "failed" | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          tenant_id: string;
          stage: "analysis" | "sketch" | "report_writing" | "proofreading";
          assigned_to?: string | null;
          assigned_by: string;
          assigned_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          status?: "pending" | "in_progress" | "completed" | "failed" | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          tenant_id?: string;
          stage?: "analysis" | "sketch" | "report_writing" | "proofreading";
          assigned_to?: string | null;
          assigned_by?: string;
          assigned_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          status?: "pending" | "in_progress" | "completed" | "failed" | null;
        };
      };
      proof_reviews: {
        Row: {
          id: string;
          project_id: string;
          tenant_id: string;
          reviewed_by: string;
          reviewed_at: string;
          result: "pass" | "fail";
          failure_reason: string | null;
          report_handler_id: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          tenant_id: string;
          reviewed_by: string;
          reviewed_at?: string;
          result: "pass" | "fail";
          failure_reason?: string | null;
          report_handler_id?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          tenant_id?: string;
          reviewed_by?: string;
          reviewed_at?: string;
          result?: "pass" | "fail";
          failure_reason?: string | null;
          report_handler_id?: string | null;
        };
      };
      site_visits: {
        Row: {
          id: string;
          project_id: string;
          tenant_id: string;
          staff_id: string;
          visit_date: string;
          number_of_floors: number | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          tenant_id: string;
          staff_id: string;
          visit_date: string;
          number_of_floors?: number | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          tenant_id?: string;
          staff_id?: string;
          visit_date?: string;
          number_of_floors?: number | null;
          created_by?: string;
          created_at?: string;
        };
      };
      status_history: {
        Row: {
          id: string;
          project_id: string;
          tenant_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string;
          changed_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          tenant_id: string;
          from_status?: string | null;
          to_status: string;
          changed_by: string;
          changed_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          tenant_id?: string;
          from_status?: string | null;
          to_status?: string;
          changed_by?: string;
          changed_at?: string;
          notes?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          type:
            | "task_assigned"
            | "stage_completed"
            | "proof_failed"
            | "proof_passed"
            | "report_delivered";
          title: string;
          body: string | null;
          related_project_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          type:
            | "task_assigned"
            | "stage_completed"
            | "proof_failed"
            | "proof_passed"
            | "report_delivered";
          title: string;
          body?: string | null;
          related_project_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          type?:
            | "task_assigned"
            | "stage_completed"
            | "proof_failed"
            | "proof_passed"
            | "report_delivered";
          title?: string;
          body?: string | null;
          related_project_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          tenant_id: string;
          email: string;
          role: "lab_owner" | "ops_manager" | "staff";
          invited_by: string;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          email: string;
          role: "lab_owner" | "ops_manager" | "staff";
          invited_by: string;
          token: string;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          email?: string;
          role?: "lab_owner" | "ops_manager" | "staff";
          invited_by?: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
      };
      user_push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          endpoint: string;
          auth_key: string;
          p256dh_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          endpoint: string;
          auth_key: string;
          p256dh_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tenant_id?: string;
          endpoint?: string;
          auth_key?: string;
          p256dh_key?: string;
          created_at?: string;
        };
      };
      site_visit_logs: {
        Row: {
          id: string;
          tenant_id: string;
          project_id: string;
          team_lead_id: string;
          manager_id: string | null;
          manager_instruction_note: string | null;
          field_notes: string | null;
          images: Json;
          status: "assigned" | "completed";
          assigned_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          project_id: string;
          team_lead_id: string;
          manager_id?: string | null;
          manager_instruction_note?: string | null;
          field_notes?: string | null;
          images?: Json;
          status?: "assigned" | "completed";
          assigned_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          project_id?: string;
          team_lead_id?: string;
          manager_id?: string | null;
          manager_instruction_note?: string | null;
          field_notes?: string | null;
          images?: Json;
          status?: "assigned" | "completed";
          assigned_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_next_serial_number: {
        Args: {
          p_tenant_id: string;
        };
        Returns: number;
      };
      advance_project_status: {
        Args: {
          p_project_id: string;
          p_stage: Database["public"]["Enums"]["stage_enum"];
        };
        Returns: undefined;
      };
    };
    Enums: {
      subscription_status_enum: "trial" | "active" | "inactive";
      user_role_enum: "super_admin" | "lab_owner" | "ops_manager" | "staff";
      project_status_enum:
        | "not_started"
        | "wip"
        | "analysis_done"
        | "sketch_done"
        | "report_done"
        | "proof_ready"
        | "report_uploaded"
        | "report_verified"
        | "report_delivered";
      stage_enum: "analysis" | "sketch" | "report_writing" | "proofreading";
      stage_status_enum: "pending" | "in_progress" | "completed" | "failed";
      proof_result_enum: "pass" | "fail";
      notification_type_enum:
        | "task_assigned"
        | "stage_completed"
        | "proof_failed"
        | "proof_passed"
        | "report_delivered"
        | "site_inspection"
        | "report_error";
    };
  };
}
