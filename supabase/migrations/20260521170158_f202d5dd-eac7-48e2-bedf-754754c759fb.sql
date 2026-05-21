-- Ensure has_role function is accessible and has correct permissions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;

-- Fix potentially missing user_roles for the admin email to ensure immediate access
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admhammer@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;