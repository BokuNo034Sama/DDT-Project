-- ENUM TYPES
CREATE TYPE subscription_status_enum AS ENUM ('trial', 'active', 'inactive');
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'lab_owner', 'ops_manager', 'staff');
CREATE TYPE project_status_enum AS ENUM ('not_started', 'wip', 'analysis_done', 'sketch_done', 'report_done', 'proof_ready', 'report_uploaded', 'report_verified', 'report_delivered');
CREATE TYPE stage_enum AS ENUM ('analysis', 'sketch', 'report_writing', 'proofreading');
CREATE TYPE stage_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE proof_result_enum AS ENUM ('pass', 'fail');
CREATE TYPE notification_type_enum AS ENUM ('task_assigned', 'stage_completed', 'proof_failed', 'proof_passed', 'report_delivered');

-- TENANTS
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  subscription_status subscription_status_enum DEFAULT 'trial',
  code_prefix     VARCHAR(10) DEFAULT 'K',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- USERS
CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  full_name       VARCHAR(200) NOT NULL,
  email           VARCHAR(200) NOT NULL,
  role            user_role_enum NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  invited_by      UUID REFERENCES users(id),
  joined_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- PROJECTS
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  ndt_code        VARCHAR(20) NOT NULL,
  serial_number   INTEGER NOT NULL,
  client_name     VARCHAR(200) NOT NULL,
  client_email    VARCHAR(200),
  client_phone    VARCHAR(50),
  address         TEXT NOT NULL,
  number_of_floors INTEGER NOT NULL,
  connection      VARCHAR(200),
  site_date       DATE NOT NULL,
  device          VARCHAR(100),
  status          project_status_enum DEFAULT 'not_started',
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, ndt_code)
);
CREATE INDEX idx_projects_tenant ON projects(tenant_id);
CREATE INDEX idx_projects_status ON projects(tenant_id, status);
CREATE INDEX idx_projects_search ON projects USING GIN(
  to_tsvector('english', client_name || ' ' || address || ' ' || ndt_code)
);

-- PROJECT STAGE ASSIGNMENTS
CREATE TABLE project_stage_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  stage           stage_enum NOT NULL,
  assigned_to     UUID REFERENCES users(id),
  assigned_by     UUID NOT NULL REFERENCES users(id),
  assigned_at     TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  status          stage_status_enum DEFAULT 'pending',
  UNIQUE(project_id, stage)
);
CREATE INDEX idx_stages_project ON project_stage_assignments(project_id);
CREATE INDEX idx_stages_staff ON project_stage_assignments(tenant_id, assigned_to);

-- PROOF REVIEWS
CREATE TABLE proof_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  reviewed_by     UUID NOT NULL REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ DEFAULT NOW(),
  result          proof_result_enum NOT NULL,
  failure_reason  TEXT,
  report_handler_id UUID REFERENCES users(id)
);
CREATE INDEX idx_proof_project ON proof_reviews(project_id);
CREATE INDEX idx_proof_staff ON proof_reviews(tenant_id, report_handler_id);

-- SITE VISITS
CREATE TABLE site_visits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  staff_id        UUID NOT NULL REFERENCES users(id),
  visit_date      DATE NOT NULL,
  number_of_floors INTEGER,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_visits_staff ON site_visits(tenant_id, staff_id);
CREATE INDEX idx_visits_month ON site_visits(tenant_id, visit_date);

-- STATUS HISTORY (audit trail)
CREATE TABLE status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  from_status     TEXT,
  to_status       TEXT NOT NULL,
  changed_by      UUID NOT NULL REFERENCES users(id),
  changed_at      TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT
);
CREATE INDEX idx_history_project ON status_history(project_id);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  type            notification_type_enum NOT NULL,
  title           VARCHAR(200) NOT NULL,
  body            TEXT,
  related_project_id UUID REFERENCES projects(id),
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notif_user ON notifications(tenant_id, user_id, is_read);

-- INVITATIONS
CREATE TABLE invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  email           VARCHAR(200) NOT NULL,
  role            user_role_enum NOT NULL,
  invited_by      UUID NOT NULL REFERENCES users(id),
  token           VARCHAR(100) UNIQUE NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stage_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Tenants: users can only see their own tenant
CREATE POLICY tenant_isolation ON tenants
  FOR SELECT USING (id = (auth.jwt()->>'tenant_id')::uuid);

-- Users: users can only see staff in their tenant
CREATE POLICY tenant_users ON users
  FOR SELECT USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- Projects: users can only see their tenant's projects
CREATE POLICY tenant_projects ON projects
  FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- Project Stages: users can only see their tenant's stages
CREATE POLICY tenant_stages ON project_stage_assignments
  FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- Proof Reviews: users can only see their tenant's reviews
CREATE POLICY tenant_proofs ON proof_reviews
  FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- Site Visits: users can only see their tenant's visits
CREATE POLICY tenant_visits ON site_visits
  FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- Status History: users can only see their tenant's history
CREATE POLICY tenant_history ON status_history
  FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- Notifications: users only see their own
CREATE POLICY own_notifications ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Invitations: users can only see their tenant's invitations
CREATE POLICY tenant_invitations ON invitations
  FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);
