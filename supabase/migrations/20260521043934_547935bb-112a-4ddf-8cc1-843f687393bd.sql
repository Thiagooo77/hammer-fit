-- Revogar privilégios padrão de execução para funções em schemas públicos
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;

-- Revogar explicitamente das funções existentes
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

-- Re-conceder apenas para roles necessárias
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hammer_has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hammer_has_role(uuid, public.hammer_role) TO authenticated, service_role;

-- Garantir que as funções de trigger (usadas internamente) continuem funcionando
-- Elas são chamadas pelo sistema (superuser/service_role)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
