-- 1. Definir search_path = public em funções customizadas
ALTER FUNCTION public.update_goal_progress_on_sale() SET search_path = public;
ALTER FUNCTION public.initialize_goal_progress() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.block_sales_after_close() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.prevent_audit_mutation() SET search_path = public;
ALTER FUNCTION public.handle_new_hammer_user() SET search_path = public;
ALTER FUNCTION public.handle_new_user_v2() SET search_path = public;
ALTER FUNCTION public.process_audit_log() SET search_path = public;
ALTER FUNCTION public.update_user_gamification() SET search_path = public;
ALTER FUNCTION public.handle_new_auth_user() SET search_path = public;

-- 2. Revogar execução pública de funções sensíveis
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 3. RLS em badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read badges" ON public.badges;
CREATE POLICY "Authenticated can read badges" ON public.badges FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can read own badges" ON public.user_badges;
CREATE POLICY "Users can read own badges" ON public.user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
