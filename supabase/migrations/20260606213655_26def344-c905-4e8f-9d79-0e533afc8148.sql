
-- Set password for existing admin user and provision company/profile/admin role
DO $$
DECLARE
  v_user uuid := '52b93746-30e7-4708-b74b-d6efcf14c780';
  v_company uuid;
BEGIN
  -- Update password
  UPDATE auth.users
  SET encrypted_password = crypt('hammer10', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE id = v_user;

  -- Create company if needed
  INSERT INTO public.companies (name) VALUES ('Hammer') RETURNING id INTO v_company;

  -- Create profile
  INSERT INTO public.profiles (id, email, nome_completo, company_id, ativo, must_change_password)
  VALUES (v_user, 'admhammer@gmail.com', 'Administrador Hammer', v_company, true, false)
  ON CONFLICT (id) DO UPDATE SET company_id = EXCLUDED.company_id, nome_completo = EXCLUDED.nome_completo;

  -- Company settings
  INSERT INTO public.company_settings (company_id, company_name, email)
  VALUES (v_company, 'Hammer', 'admhammer@gmail.com');

  -- Admin role
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
