
UPDATE auth.users
SET
  encrypted_password = crypt('lucasheitor', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email = 'es73896@gmail.com';

INSERT INTO public.hammer_profiles (id, full_name)
SELECT id, 'lucasheitor'
FROM auth.users
WHERE email = 'es73896@gmail.com'
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = now();

INSERT INTO public.hammer_roles (user_id, role)
SELECT id, 'admin'::hammer_role
FROM auth.users
WHERE email = 'es73896@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
