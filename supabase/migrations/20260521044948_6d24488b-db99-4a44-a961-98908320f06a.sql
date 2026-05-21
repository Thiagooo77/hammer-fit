-- 1. Recriar a função de sincronização (Security Definer para bypassar RLS)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.app_role;
BEGIN
  -- Definir papel baseado no email
  IF NEW.email = 'admhammer@gmail.com' THEN
    assigned_role := 'admin'::public.app_role;
  ELSE
    assigned_role := 'receptionist'::public.app_role;
  END IF;

  -- Inserir/Atualizar em public.users
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Colaborador'),
    NEW.email,
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

  -- Inserir em public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Se for admin, garantir que esteja na tabela de roles mesmo se já existir
  IF assigned_role = 'admin' THEN
     INSERT INTO public.user_roles (user_id, role)
     VALUES (NEW.id, 'admin')
     ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Reativar o trigger (Remover se já existir para evitar erro)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. Promover usuário caso ele já tenha se cadastrado durante o setup
DO $$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = 'admhammer@gmail.com';
  IF FOUND THEN
    INSERT INTO public.users (id, name, email, role)
    VALUES (target_id, 'Administrador Master', 'admhammer@gmail.com', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';

    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
