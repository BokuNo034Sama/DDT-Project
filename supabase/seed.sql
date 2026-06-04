-- supabase/seed.sql

-- Insert 2 Test Tenants
INSERT INTO public.tenants (id, name, slug, subscription_status, code_prefix)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Alpha Labs', 'alpha-labs', 'active', 'ALPHA'),
  ('22222222-2222-2222-2222-222222222222', 'Beta Labs', 'beta-labs', 'trial', 'BETA')
ON CONFLICT (id) DO NOTHING;

-- Insert 3 users into auth.users (dummy passwords)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'admin@ddt.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Super Admin"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'owner@alpha.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alpha Owner"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'staff@alpha.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alpha Staff"}', now(), now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Insert into public.users
INSERT INTO public.users (id, tenant_id, full_name, email, role, is_active, joined_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Super Admin', 'admin@ddt.com', 'super_admin', true, now()),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Alpha Owner', 'owner@alpha.com', 'lab_owner', true, now()),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Alpha Staff', 'staff@alpha.com', 'staff', true, now())
ON CONFLICT (id) DO NOTHING;

-- Insert dummy project
INSERT INTO public.projects (id, tenant_id, ndt_code, serial_number, client_name, address, number_of_floors, site_date, status, created_by, is_sample)
VALUES
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'ALPHA-001', 1, 'Test Client 1', '123 Alpha St', 5, '2025-01-01', 'wip', '44444444-4444-4444-4444-444444444444', false)
ON CONFLICT (id) DO NOTHING;

-- Insert dummy stage assignment
INSERT INTO public.project_stage_assignments (id, project_id, tenant_id, stage, assigned_to, assigned_by, status)
VALUES
  ('77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'analysis', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'in_progress')
ON CONFLICT (id) DO NOTHING;
