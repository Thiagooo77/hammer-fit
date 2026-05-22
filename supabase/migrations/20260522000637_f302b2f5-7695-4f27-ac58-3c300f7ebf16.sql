DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admhammer@gmail.com';
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin principal nao encontrado. Abortando reset.';
  END IF;
  RAISE NOTICE '[UserReset] Admin preservado: %', admin_id;
END $$;

UPDATE public.receptionists
SET user_id = NULL, active = false, status = 'blocked'
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM auth.users WHERE email = 'admhammer@gmail.com');

DELETE FROM public.user_roles
WHERE user_id NOT IN (SELECT id FROM auth.users WHERE email = 'admhammer@gmail.com');

DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users WHERE email = 'admhammer@gmail.com');

DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users WHERE email = 'admhammer@gmail.com');

DELETE FROM auth.users
WHERE email <> 'admhammer@gmail.com';

CREATE OR REPLACE FUNCTION public.block_public_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text;
BEGIN
  BEGIN
    jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL;
  END;

  IF jwt_role IS NULL OR jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Cadastro publico desabilitado. Contas sao criadas exclusivamente pelo administrador.'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS block_public_signup_trigger ON auth.users;
CREATE TRIGGER block_public_signup_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.block_public_signup();

INSERT INTO public.audit_logs (user_id, user_name, action_type, module, description, new_data)
SELECT
  id,
  'Sistema',
  'user_reset',
  'auth',
  'Reset completo de usuarios: preservado apenas admhammer@gmail.com. Cadastro publico bloqueado.',
  jsonb_build_object('preserved_admin', email)
FROM auth.users WHERE email = 'admhammer@gmail.com';