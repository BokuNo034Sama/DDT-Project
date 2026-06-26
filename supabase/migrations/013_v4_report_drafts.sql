CREATE TYPE draft_status_enum AS ENUM (
  'generating', 'draft_ready', 'staff_editing',
  'ready_for_proofread', 'sent_to_proofread'
);

CREATE TABLE report_drafts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  generated_by      UUID NOT NULL REFERENCES users(id),
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  concrete_grade    VARCHAR(10) NOT NULL DEFAULT '25',
  drawing_provided  BOOLEAN DEFAULT FALSE,
  excel_data        JSONB,
  rebar_data        JSONB,
  draft_filename    VARCHAR(300),
  storage_path      TEXT,
  status            draft_status_enum DEFAULT 'generating',
  iteration         INTEGER DEFAULT 1,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_drafts_project ON report_drafts(project_id);
CREATE INDEX idx_report_drafts_tenant ON report_drafts(tenant_id);

ALTER TABLE report_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_report_drafts ON report_drafts
  USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );
