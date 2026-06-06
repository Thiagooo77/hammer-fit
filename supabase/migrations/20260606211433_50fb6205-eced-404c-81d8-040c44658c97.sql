
-- =========== COMPANIES ===========
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== EXTEND PROFILES ===========
ALTER TABLE public.profiles
  ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN salario numeric(12,2),
  ADD COLUMN horario_entrada time,
  ADD COLUMN horario_saida time,
  ADD COLUMN ativo boolean NOT NULL DEFAULT true,
  ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;

CREATE INDEX idx_profiles_company ON public.profiles(company_id);

-- Helper: get current user's company
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id
$$;

-- Companies policies
CREATE POLICY "Usuários veem própria empresa" ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admins atualizam própria empresa" ON public.companies
  FOR UPDATE TO authenticated
  USING (id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Profiles: admin manage colaboradores na própria empresa
CREATE POLICY "Admins veem colaboradores da empresa" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins atualizam colaboradores da empresa" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  );

-- =========== COMPANY SETTINGS ===========
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  cnpj text,
  endereco text,
  telefone text,
  email text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem settings da empresa" ON public.company_settings
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admins gerenciam settings" ON public.company_settings
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_company_settings_updated BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== PUNCHES ===========
CREATE TYPE public.punch_type AS ENUM ('entrada','almoco_saida','almoco_retorno','saida');

CREATE TABLE public.punches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  punch_type public.punch_type NOT NULL,
  punched_at timestamptz NOT NULL DEFAULT now(),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  device_info jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_punches_user_date ON public.punches(user_id, punched_at DESC);
CREATE INDEX idx_punches_company_date ON public.punches(company_id, punched_at DESC);

GRANT SELECT, INSERT ON public.punches TO authenticated;
GRANT ALL ON public.punches TO service_role;
ALTER TABLE public.punches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprios pontos" ON public.punches
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin')));
CREATE POLICY "Usuário registra próprio ponto" ON public.punches
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id = public.get_user_company_id(auth.uid()));

-- =========== PAYROLL CYCLES ===========
CREATE TYPE public.payroll_status AS ENUM ('aberto','fechado','pago');

CREATE TABLE public.payroll_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status public.payroll_status NOT NULL DEFAULT 'aberto',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, start_date, end_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_cycles TO authenticated;
GRANT ALL ON public.payroll_cycles TO service_role;
ALTER TABLE public.payroll_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem ciclos" ON public.payroll_cycles
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admins gerenciam ciclos" ON public.payroll_cycles
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_payroll_cycles_updated BEFORE UPDATE ON public.payroll_cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== PAYSLIPS ===========
CREATE TABLE public.payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.payroll_cycles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  base_salary numeric(12,2) NOT NULL DEFAULT 0,
  extra_hours numeric(8,2) NOT NULL DEFAULT 0,
  extra_hours_value numeric(12,2) NOT NULL DEFAULT 0,
  delays numeric(8,2) NOT NULL DEFAULT 0,
  discounts numeric(12,2) NOT NULL DEFAULT 0,
  bonuses numeric(12,2) NOT NULL DEFAULT 0,
  final_salary numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  approved boolean NOT NULL DEFAULT false,
  released boolean NOT NULL DEFAULT false,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cycle_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payslips TO authenticated;
GRANT ALL ON public.payslips TO service_role;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaborador vê próprios holerites liberados" ON public.payslips
  FOR SELECT TO authenticated
  USING (
    (user_id = auth.uid() AND released = true)
    OR (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'))
  );
CREATE POLICY "Admins gerenciam holerites" ON public.payslips
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_payslips_updated BEFORE UPDATE ON public.payslips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== TIME BANK ===========
CREATE TYPE public.time_bank_kind AS ENUM ('extra','devedora','ajuste');

CREATE TABLE public.time_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind public.time_bank_kind NOT NULL,
  hours numeric(8,2) NOT NULL,
  reference_date date NOT NULL DEFAULT current_date,
  notes text,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_time_bank_user ON public.time_bank(user_id, reference_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_bank TO authenticated;
GRANT ALL ON public.time_bank TO service_role;
ALTER TABLE public.time_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaborador vê próprio banco" ON public.time_bank
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin')));
CREATE POLICY "Admins gerenciam banco de horas" ON public.time_bank
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

-- =========== AUDIT LOGS ===========
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  metadata jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_company_date ON public.audit_logs(company_id, created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem logs da empresa" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Usuários gravam próprios logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- =========== USER ROLES (allow admin manage within company) ===========
CREATE POLICY "Admins gerenciam roles na empresa" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    AND public.get_user_company_id(user_id) = public.get_user_company_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    AND public.get_user_company_id(user_id) = public.get_user_company_id(auth.uid())
  );
