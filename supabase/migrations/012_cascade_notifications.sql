-- Ensure cascading deletion for notifications when projects are deleted
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_related_project_id_fkey,
ADD CONSTRAINT notifications_related_project_id_fkey 
  FOREIGN KEY (related_project_id) 
  REFERENCES public.projects(id) 
  ON DELETE CASCADE;
