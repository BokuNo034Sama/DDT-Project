-- Create admin audit log table
CREATE TABLE admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      VARCHAR(100) NOT NULL,
  target_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_tenant ON admin_audit_log(target_tenant_id);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
