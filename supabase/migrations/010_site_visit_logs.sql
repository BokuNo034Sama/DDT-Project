-- Create site visit logs table for contextual manager instructions and team lead field submissions
CREATE TABLE public.site_visit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  team_lead_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Manager Input Layer
  manager_instruction_note TEXT,
  
  -- Team Lead Submission Layer
  field_notes TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of objects: { url: string, type: string, capturedAt: string }
  
  -- Lifecycle Tracking States
  status VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  CONSTRAINT chk_completed_fields CHECK (
    status = 'assigned' OR (status = 'completed' AND field_notes IS NOT NULL)
  )
);

-- Optimization Indices
CREATE INDEX idx_site_visit_logs_project_id ON public.site_visit_logs(project_id);
CREATE INDEX idx_site_visit_logs_status ON public.site_visit_logs(status);

-- Enable RLS and define tenant-isolation policies
ALTER TABLE public.site_visit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_site_visit_logs ON public.site_visit_logs
  FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);
