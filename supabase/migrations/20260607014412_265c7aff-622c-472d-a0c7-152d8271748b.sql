
DO $$ BEGIN
  CREATE TYPE public.attendance_decision AS ENUM ('falta', 'abonado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.attendance_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  reference_date DATE NOT NULL,
  decision public.attendance_decision NOT NULL,
  notes TEXT,
  decided_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, reference_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_decisions TO authenticated;
GRANT ALL ON public.attendance_decisions TO service_role;

ALTER TABLE public.attendance_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaborador vê próprias decisões"
  ON public.attendance_decisions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins gerenciam decisões"
  ON public.attendance_decisions FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_attendance_decisions_updated_at
  BEFORE UPDATE ON public.attendance_decisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
