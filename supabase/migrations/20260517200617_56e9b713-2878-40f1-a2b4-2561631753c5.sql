
-- Find user id for es73896@gmail.com and upsert admin role
INSERT INTO public.hammer_roles (user_id, role)
SELECT id, 'admin'::hammer_role
FROM auth.users
WHERE email = 'es73896@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure the profile exists with the correct name if provided (lucasheitor)
INSERT INTO public.hammer_profiles (id, full_name)
SELECT id, 'lucasheitor'
FROM auth.users
WHERE email = 'es73896@gmail.com'
ON CONFLICT (id) DO UPDATE SET full_name = 'lucasheitor';
