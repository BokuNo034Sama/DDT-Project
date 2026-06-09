-- Alter site_visits table to support operational lifecycles
ALTER TABLE public.site_visits ADD COLUMN is_team_leader BOOLEAN DEFAULT false;
ALTER TABLE public.site_visits ADD COLUMN status VARCHAR(50) DEFAULT 'pending'; -- 'pending', 'in_progress', 'completed'
ALTER TABLE public.site_visits ADD COLUMN started_at TIMESTAMPTZ;
ALTER TABLE public.site_visits ADD COLUMN completed_at TIMESTAMPTZ;
