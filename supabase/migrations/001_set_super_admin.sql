-- Set super_admin role for the platform owner.
-- Run manually in the Supabase SQL Editor. This is NOT an auto-run migration.
-- Only one user should ever have this role.

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'
WHERE email = 'hpdocs@gmail.com';
