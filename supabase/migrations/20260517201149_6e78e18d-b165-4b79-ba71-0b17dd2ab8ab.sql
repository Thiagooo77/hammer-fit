
-- 1. Forçar a confirmação de e-mail para todos os usuários existentes
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- 2. Corrigir permissão da função handle_new_hammer_user (estava duplicando perfis ou falhando silenciosamente)
CREATE OR REPLACE FUNCTION public.handle_new_hammer_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Tentar inserir no perfil
  INSERT INTO public.hammer_profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  
  -- Garantir role de funcionário por padrão
  INSERT INTO public.hammer_roles (user_id, role)
  VALUES (NEW.id, 'employee')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- 3. Garantir que o ADM es73896@gmail.com tenha as permissões corretas
INSERT INTO public.hammer_roles (user_id, role)
SELECT id, 'admin'::hammer_role
FROM auth.users
WHERE email = 'es73896@gmail.com'
ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin'::hammer_role;
