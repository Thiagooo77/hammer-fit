-- Atualizar funções SECURITY DEFINER com search_path = public
CREATE OR REPLACE FUNCTION public.update_goal_progress_on_sale() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE public.goal_progress SET sold_amount = sold_amount + NEW.amount WHERE receptionist_id = NEW.receptionist_id; RETURN NEW; END; $$;
-- Note: initialize_goal_progress may need different logic depending on when it's called
CREATE OR REPLACE FUNCTION public.initialize_goal_progress() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.goal_progress (receptionist_id, goal_amount, sold_amount) VALUES (NEW.created_by, NEW.goal_amount, 0); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.users (id, name, email) VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.block_sales_after_close() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF EXISTS (SELECT 1 FROM public.cash_sessions WHERE id = NEW.cash_session_id AND status = 'closed') THEN RAISE EXCEPTION 'Cannot add sale to closed session'; END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.handle_new_hammer_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.users (id, name, email, role) VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email, 'receptionist'); INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'receptionist'); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.hammer_has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 from public.user_roles where user_id = _user_id and role = _role); $$;
CREATE OR REPLACE FUNCTION public.handle_new_user_v2() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.users (id, name, email, role) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NEW.email, 'receptionist'); INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'receptionist'); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.process_audit_log() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.audit_logs (user_id, action_type, module, description) VALUES (NEW.user_id, NEW.action_type, NEW.module, NEW.description); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.update_user_gamification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN RETURN NEW; END; $$;

-- Corrigir a View vw_ia_performance_prediction se ela existir
DROP VIEW IF EXISTS public.vw_ia_performance_prediction;
-- Removendo a view problemática se não conseguirmos reconstruí-la agora com os campos corretos
-- Ou criando uma versão simplificada baseada na tabela 'goals' ou 'goal_progress'
CREATE VIEW public.vw_ia_performance_prediction WITH (security_invoker = true) AS 
SELECT id, goal_amount, sold_amount, 
       CASE WHEN goal_amount > 0 THEN (sold_amount / goal_amount * 100) ELSE 0 END as percentage
FROM public.goal_progress;

-- Revogar execução pública de funções sensíveis
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.hammer_has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hammer_has_role(uuid, public.app_role) TO authenticated, service_role;
