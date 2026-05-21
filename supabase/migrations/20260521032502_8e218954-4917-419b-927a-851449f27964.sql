-- Corrigindo RLS para user_roles
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Corrigindo search_path e permissões de funções SECURITY DEFINER
ALTER FUNCTION public.update_goal_progress_on_sale() SET search_path = public;
ALTER FUNCTION public.initialize_goal_progress() SET search_path = public;

-- Revogar EXECUTE público das funções sensíveis
REVOKE EXECUTE ON FUNCTION public.update_goal_progress_on_sale() FROM public;
REVOKE EXECUTE ON FUNCTION public.initialize_goal_progress() FROM public;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM public;

-- Garantir acesso apenas a usuários autenticados (conforme necessário)
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
