-- Remover triggers duplicados
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_hammer ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users;

-- Criar função robusta de criação de usuário
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role public.app_role := 'receptionist';
BEGIN
  -- Inserir em public.users
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Colaborador'),
    NEW.email,
    default_role
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;

  -- Inserir em public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, default_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Se o email já existir em receptionists, vincular o user_id
  UPDATE public.receptionists
  SET user_id = NEW.id
  WHERE email = NEW.email;

  RETURN NEW;
END;
$$;

-- Criar o trigger único
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Sincronizar usuários existentes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
    -- Inserir em public.users
    INSERT INTO public.users (id, name, email, role)
    VALUES (
      r.id,
      COALESCE(r.raw_user_meta_data->>'name', 'Colaborador'),
      r.email,
      'receptionist'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Inserir em public.user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (r.id, 'receptionist')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Vincular receptionists
    UPDATE public.receptionists
    SET user_id = r.id
    WHERE email = r.email;
  END LOOP;
END;
$$;
