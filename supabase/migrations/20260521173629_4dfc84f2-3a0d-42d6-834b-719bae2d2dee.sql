INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email IN ('es73896@gmail.com', 'es73896@gmail.com.br')
ON CONFLICT DO NOTHING;