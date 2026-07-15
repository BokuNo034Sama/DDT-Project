-- Migration 015: Lab Equipment and Site Visit Equipment Integration

CREATE TABLE lab_equipment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipment_name  VARCHAR(200) NOT NULL,
  serial_number   VARCHAR(100) NOT NULL,
  equipment_type  VARCHAR(50) NOT NULL DEFAULT 'UPV',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_equipment_tenant ON lab_equipment(tenant_id);
ALTER TABLE lab_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_lab_equipment ON lab_equipment
  USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );

CREATE TABLE site_visit_equipment (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_visit_id  UUID NOT NULL REFERENCES site_visits(id) ON DELETE CASCADE,
  equipment_id   UUID NOT NULL REFERENCES lab_equipment(id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transducer_ok  BOOLEAN DEFAULT TRUE,
  display_ok     BOOLEAN DEFAULT TRUE,
  cables_ok      BOOLEAN DEFAULT TRUE,
  battery_status VARCHAR(20) NOT NULL DEFAULT '100%',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_site_visit_equipment_visit ON site_visit_equipment(site_visit_id);
ALTER TABLE site_visit_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_site_visit_equipment ON site_visit_equipment
  USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );

-- Add equipment_data to report_drafts table
ALTER TABLE report_drafts ADD COLUMN equipment_data JSONB;
