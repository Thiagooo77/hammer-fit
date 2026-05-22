-- Backfill public.users for any auth.users missing a row (covers users created before triggers were configured)
INSERT INTO public.users (id, name, email, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'Colaborador'),
  au.email,
  COALESCE(
    (SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = au.id ORDER BY (ur.role = 'admin') DESC LIMIT 1)::public.app_role,
    'receptionist'::public.app_role
  )
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- Ensure every auth user has at least the receptionist role row
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'receptionist'::public.app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.user_id IS NULL;

-- (Re)create the trigger that handles new auth user signups, so future receptionists are provisioned automatically.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();