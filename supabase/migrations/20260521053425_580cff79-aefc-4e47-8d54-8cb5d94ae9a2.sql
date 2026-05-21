-- 1. Limpar duplicatas se existirem antes de adicionar UNIQUE
DELETE FROM public.user_roles a USING public.user_roles b 
WHERE a.id < b.id AND a.user_id = b.user_id;

-- 2. Adicionar restrição UNIQUE
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- 3. Garantir que o usuário admhammer@gmail.com seja admin
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'admhammer@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Garantir na tabela public.users
        INSERT INTO public.users (id, email, name, role, status)
        VALUES (target_user_id, 'admhammer@gmail.com', 'Administrador Master', 'admin', 'active')
        ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';

        -- Garantir na tabela public.user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    END IF;
END $$;

-- 4. Otimizar RLS
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));
