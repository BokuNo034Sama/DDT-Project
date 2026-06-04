CREATE TYPE ai_check_status AS ENUM ('pending', 'running', 'completed', 'failed');

CREATE TABLE report_checks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  triggered_by    UUID NOT NULL REFERENCES users(id),
  status          ai_check_status DEFAULT 'pending',
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  overall_score   INTEGER,
  results_json    JSONB,
  error_message   TEXT
);

CREATE INDEX idx_report_checks_project ON report_checks(project_id);
CREATE INDEX idx_report_checks_tenant ON report_checks(tenant_id);

ALTER TABLE report_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_report_checks ON report_checks
  FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);
