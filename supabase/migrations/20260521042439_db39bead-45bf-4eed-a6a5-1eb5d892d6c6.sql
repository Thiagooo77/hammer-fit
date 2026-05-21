-- 1. Extensão de Tabelas para Gamificação e Metadados
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_sale_at TIMESTAMP WITH TIME ZONE;

-- 2. Tabela de Badges/Conquistas
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    criteria_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- 3. Sistema de Auditoria Robusto
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Função genérica para log de auditoria
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        created_at
    ) VALUES (
        current_user_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        now()
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativando auditoria nas tabelas críticas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_trigger_sales') THEN
        CREATE TRIGGER audit_trigger_sales AFTER INSERT OR UPDATE OR DELETE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_trigger_cash_sessions') THEN
        CREATE TRIGGER audit_trigger_cash_sessions AFTER INSERT OR UPDATE OR DELETE ON public.cash_sessions FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
    END IF;
END $$;

-- 4. RBAC e RLS Refinado
-- Política: Recepcionistas só podem ver suas próprias vendas
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Recepcionistas veem apenas suas vendas" ON public.sales;
CREATE POLICY "Recepcionistas veem apenas suas vendas" 
ON public.sales 
FOR SELECT 
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager') OR
    receptionist_id IN (SELECT id FROM public.receptionists WHERE user_id = auth.uid())
);

-- Política: Cash Sessions - Recepcionistas veem as suas
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Recepcionistas veem apenas suas sessões" ON public.cash_sessions;
CREATE POLICY "Recepcionistas veem apenas suas sessões" 
ON public.cash_sessions 
FOR SELECT 
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager') OR
    receptionist_id IN (SELECT id FROM public.receptionists WHERE user_id = auth.uid())
);

-- 5. Views para IA e Analytics
CREATE OR REPLACE VIEW public.vw_ia_performance_prediction AS
SELECT 
    receptionist_id,
    date_trunc('hour', created_at) as hour_bucket,
    avg(amount) as avg_amount,
    count(*) as sales_count,
    sum(amount) as total_revenue
FROM public.sales
GROUP BY 1, 2;

-- 6. Trigger para atualizar streaks e pontos de gamificação
CREATE OR REPLACE FUNCTION public.update_user_gamification()
RETURNS TRIGGER AS $$
BEGIN
    -- Adicionar pontos (10 pontos por venda)
    UPDATE public.users 
    SET points = points + 10,
        last_sale_at = now()
    WHERE id = (SELECT user_id FROM public.receptionists WHERE id = NEW.receptionist_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_gamification 
AFTER INSERT ON public.sales 
FOR EACH ROW EXECUTE FUNCTION public.update_user_gamification();
