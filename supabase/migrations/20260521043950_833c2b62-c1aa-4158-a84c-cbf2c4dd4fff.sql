-- Revogar execução de funções de trigger para usuários autenticados (apenas service_role/system podem chamar)
REVOKE EXECUTE ON FUNCTION public.update_goal_progress_on_sale() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.initialize_goal_progress() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.process_audit_log() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_gamification() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_audit_mutation() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.block_sales_after_close() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_hammer_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_v2() FROM authenticated;

-- Garantir que service_role mantenha acesso
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
