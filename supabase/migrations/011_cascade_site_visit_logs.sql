-- Ensure cascading deletion for site_visit_logs on projects deletion
ALTER TABLE public.site_visit_logs 
DROP CONSTRAINT IF EXISTS site_visit_logs_project_id_fkey,
ADD CONSTRAINT site_visit_logs_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES public.projects(id) 
  ON DELETE CASCADE;
