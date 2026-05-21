-- Ativar RLS nas tabelas que estavam sem
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para badges (leitura por todos autenticados)
DROP POLICY IF EXISTS "Badges viewable by all" ON public.badges;
CREATE POLICY "Badges viewable by all" ON public.badges FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "User badges viewable by self" ON public.user_badges;
CREATE POLICY "User badges viewable by self" ON public.user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Ajustar funções SECURITY DEFINER para evitar vulnerabilidades de search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Garantir que outras funções críticas tenham search_path setado
-- (Se houver outras funções detectadas pelo linter, elas devem ser listadas aqui)

-- Exemplo de correção de trigger function se necessário:
-- CREATE OR REPLACE FUNCTION public.handle_new_user() ... SET search_path = public;
