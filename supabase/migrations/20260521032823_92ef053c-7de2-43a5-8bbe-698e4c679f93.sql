-- 1. Atribuir cargo de admin ao usuário logado (es73896@gmail.com)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'es73896@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Cadastrar o usuário logado como recepcionista
INSERT INTO public.receptionists (name, email, goal_value)
VALUES ('Eduardo Silva', 'es73896@gmail.com', 2500.00)
ON CONFLICT (email) DO NOTHING;

-- 3. Cadastrar outros recepcionistas para o ranking
INSERT INTO public.receptionists (name, email, goal_value)
VALUES 
    ('Ana Silva', 'ana.silva@hammer.com', 3000.00),
    ('Beto Oliveira', 'beto.oliveira@hammer.com', 2000.00),
    ('Carla Souza', 'carla.souza@hammer.com', 1500.00)
ON CONFLICT (email) DO NOTHING;

-- 4. Definir meta diária da clínica
INSERT INTO public.daily_goals (goal_date, goal_amount)
VALUES (CURRENT_DATE, 8000.00)
ON CONFLICT (goal_date) DO UPDATE SET goal_amount = 8000.00;

-- 5. Simular algumas vendas para popular o ranking e progresso
-- Primeiro, pegar os IDs
DO $$
DECLARE
    rec_edu_id UUID;
    rec_ana_id UUID;
    session_id UUID;
BEGIN
    SELECT id INTO rec_edu_id FROM public.receptionists WHERE email = 'es73896@gmail.com';
    SELECT id INTO rec_ana_id FROM public.receptionists WHERE email = 'ana.silva@hammer.com';

    -- Criar uma sessão de caixa aberta para o Eduardo
    INSERT INTO public.cash_sessions (receptionist_id, opening_balance, status)
    VALUES (rec_edu_id, 100.00, 'open')
    RETURNING id INTO session_id;

    -- Inserir vendas
    INSERT INTO public.sales (cash_session_id, receptionist_id, service_name, client_name, payment_method, amount)
    VALUES 
        (session_id, rec_edu_id, 'Mensalidade Premium', 'Carlos Magno', 'pix', 250.00),
        (session_id, rec_edu_id, 'Avaliação Física', 'Julia Costa', 'cartao', 80.00);

    -- Simular progresso manual para os outros (já que não têm sessão aberta agora)
    UPDATE public.goal_progress SET sold_amount = 3200.00 WHERE receptionist_id = rec_ana_id;
END $$;
