-- 1. Controle de Cargos (Roles) conforme as diretrizes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 2. Enums do sistema de recepção
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cash_session_status') THEN
        CREATE TYPE public.cash_session_status AS ENUM ('open', 'pending_review', 'closed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE public.payment_method AS ENUM ('pix', 'dinheiro', 'cartao', 'convenio', 'outros');
    END IF;
END $$;

-- 3. Tabelas Principais
CREATE TABLE IF NOT EXISTS public.receptionists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    goal_value DECIMAL(12,2) DEFAULT 0.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receptionist_id UUID REFERENCES public.receptionists(id) ON DELETE CASCADE NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    opening_balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    closing_balance DECIMAL(12,2),
    expected_balance DECIMAL(12,2),
    difference DECIMAL(12,2),
    status public.cash_session_status DEFAULT 'open' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_session_id UUID REFERENCES public.cash_sessions(id) ON DELETE CASCADE NOT NULL,
    receptionist_id UUID REFERENCES public.receptionists(id) ON DELETE CASCADE NOT NULL,
    service_name TEXT NOT NULL,
    client_name TEXT,
    payment_method public.payment_method NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_date DATE DEFAULT CURRENT_DATE NOT NULL UNIQUE,
    goal_amount DECIMAL(12,2) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goal_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receptionist_id UUID REFERENCES public.receptionists(id) ON DELETE CASCADE NOT NULL,
    goal_amount DECIMAL(12,2) NOT NULL,
    sold_amount DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (goal_amount - sold_amount) STORED,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(receptionist_id)
);

-- 4. Habilitar RLS
ALTER TABLE public.receptionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
-- Receptionists
CREATE POLICY "Receptionists viewable by all" ON public.receptionists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage receptionists" ON public.receptionists FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Cash Sessions
CREATE POLICY "Cash sessions viewable by all" ON public.cash_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own sessions" ON public.cash_sessions FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.receptionists WHERE id = receptionist_id AND email = (SELECT email FROM auth.users WHERE id = auth.uid())));
CREATE POLICY "Users update own sessions" ON public.cash_sessions FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.receptionists WHERE id = receptionist_id AND email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- Sales
CREATE POLICY "Sales viewable by all" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert sales into open sessions" ON public.sales FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.cash_sessions WHERE id = cash_session_id AND status = 'open'));

-- Daily Goals
CREATE POLICY "Daily goals viewable by all" ON public.daily_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage daily goals" ON public.daily_goals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Goal Progress
CREATE POLICY "Goal progress viewable by all" ON public.goal_progress FOR SELECT TO authenticated USING (true);

-- 6. Triggers
CREATE OR REPLACE FUNCTION public.update_goal_progress_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.goal_progress
    SET sold_amount = sold_amount + NEW.amount,
        updated_at = now()
    WHERE receptionist_id = NEW.receptionist_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_sale_inserted ON public.sales;
CREATE TRIGGER on_sale_inserted
AFTER INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.update_goal_progress_on_sale();

CREATE OR REPLACE FUNCTION public.initialize_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.goal_progress (receptionist_id, goal_amount)
    VALUES (NEW.id, NEW.goal_value)
    ON CONFLICT (receptionist_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_receptionist_created ON public.receptionists;
CREATE TRIGGER on_receptionist_created
AFTER INSERT ON public.receptionists
FOR EACH ROW EXECUTE FUNCTION public.initialize_goal_progress();
