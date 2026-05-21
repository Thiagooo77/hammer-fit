-- Desativar triggers temporariamente para evitar efeitos colaterais durante a limpeza
SET session_replication_role = 'replica';

-- Limpar dados de auditoria e logs
TRUNCATE TABLE public.audit_logs RESTART IDENTITY CASCADE;

-- Limpar dados de vendas e caixas
TRUNCATE TABLE public.sales RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.cash_sessions RESTART IDENTITY CASCADE;

-- Limpar metas e progresso
TRUNCATE TABLE public.goal_progress RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.goals RESTART IDENTITY CASCADE;

-- Limpar gamificação
TRUNCATE TABLE public.user_badges RESTART IDENTITY CASCADE;
-- badges (tabela mestre) pode ser mantida ou limpa. Vamos manter as definições de badges.

-- Limpar dados de usuários e colaboradores
TRUNCATE TABLE public.receptionists RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.user_roles RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;

-- Reativar triggers
SET session_replication_role = 'origin';
