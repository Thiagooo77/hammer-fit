CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name TEXT,
  action_type TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins read audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- No INSERT/UPDATE/DELETE policies => writes only via service role (server)
-- Extra hard guard: prevent updates/deletes even if a policy is added later
CREATE OR REPLACE FUNCTION public.prevent_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are immutable';
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_no_update ON public.audit_logs;
CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_mutation();

-- Anti-fraud: block sales mutations when their cash session is closed
CREATE OR REPLACE FUNCTION public.block_sales_after_close()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s_status cash_session_status;
BEGIN
  SELECT status INTO s_status FROM public.cash_sessions
    WHERE id = COALESCE(NEW.cash_session_id, OLD.cash_session_id);
  IF s_status <> 'open' THEN
    RAISE EXCEPTION 'Caixa já fechado: alteração de venda bloqueada';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sales_no_edit_after_close ON public.sales;
CREATE TRIGGER sales_no_edit_after_close
  BEFORE UPDATE OR DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.block_sales_after_close();
