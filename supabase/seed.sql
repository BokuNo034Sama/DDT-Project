-- Seed data for local development

-- Create a dummy tenant
INSERT INTO tenants (id, name, slug, subscription_status, code_prefix)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Lab Lagos', 'test-lab', 'active', 'K')
ON CONFLICT (slug) DO NOTHING;

-- Note: We can't easily insert into auth.users directly via SQL in a clean way without hashing passwords manually.
-- The user will need to sign up via the UI to get an auth.users record, which will then trigger their public.users record 
-- via Supabase triggers (if set up) or manual insertion.

-- Let's assume the user signs up and gets an ID, they will have to be linked manually for now in local dev,
-- or we can insert some dummy projects assigned to the tenant.

INSERT INTO projects (id, tenant_id, ndt_code, serial_number, client_name, address, number_of_floors, site_date, status, created_by)
VALUES 
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'K001', 1, 'Dangote Refinery', 'Lekki Free Zone', 4, '2026-05-10', 'wip', '00000000-0000-0000-0000-000000000000'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'K002', 2, 'Eko Atlantic Tower', 'Victoria Island', 12, '2026-05-12', 'analysis_done', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;
