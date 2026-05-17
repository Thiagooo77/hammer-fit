
-- Enum para roles do HAMMER FIT
CREATE TYPE public.hammer_role AS ENUM ('admin', 'employee');

-- Tabela de roles (separada do profiles, padrão de segurança)
CREATE TABLE public.hammer_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role hammer_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.hammer_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function para checar roles
CREATE OR REPLACE FUNCTION public.hammer_has_role(_user_id UUID, _role hammer_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hammer_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Setores
CREATE TABLE public.hammer_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#f7931e',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hammer_sectors ENABLE ROW LEVEL SECURITY;

-- Profiles para HAMMER FIT
CREATE TABLE public.hammer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  sector_id UUID REFERENCES public.hammer_sectors(id) ON DELETE SET NULL,
  position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hammer_profiles ENABLE ROW LEVEL SECURITY;

-- Tasks
CREATE TABLE public.hammer_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sector_id UUID REFERENCES public.hammer_sectors(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'rejected')),
  due_date TIMESTAMPTZ,
  feedback TEXT,
  photo_url TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.hammer_tasks ENABLE ROW LEVEL SECURITY;

-- Goals
CREATE TABLE public.hammer_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  sector_id UUID REFERENCES public.hammer_sectors(id) ON DELETE SET NULL,
  target_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hammer_goals ENABLE ROW LEVEL SECURITY;

-- Sales
CREATE TABLE public.hammer_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  plan TEXT,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission NUMERIC(12,2) DEFAULT 0,
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hammer_sales ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.hammer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hammer_notifications ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============

-- hammer_roles
CREATE POLICY "Users read own roles" ON public.hammer_roles
  FOR SELECT USING (auth.uid() = user_id OR public.hammer_has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.hammer_roles
  FOR ALL USING (public.hammer_has_role(auth.uid(), 'admin'))
  WITH CHECK (public.hammer_has_role(auth.uid(), 'admin'));

-- hammer_sectors
CREATE POLICY "Anyone authenticated read sectors" ON public.hammer_sectors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage sectors" ON public.hammer_sectors
  FOR ALL USING (public.hammer_has_role(auth.uid(), 'admin'))
  WITH CHECK (public.hammer_has_role(auth.uid(), 'admin'));

-- hammer_profiles
CREATE POLICY "Anyone authenticated read hammer profiles" ON public.hammer_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own hammer profile" ON public.hammer_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins manage hammer profiles" ON public.hammer_profiles
  FOR ALL USING (public.hammer_has_role(auth.uid(), 'admin'))
  WITH CHECK (public.hammer_has_role(auth.uid(), 'admin'));

-- hammer_tasks: employees see only their assigned tasks; admins see all
CREATE POLICY "Employees see own tasks" ON public.hammer_tasks
  FOR SELECT USING (auth.uid() = assigned_to OR public.hammer_has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees update own tasks" ON public.hammer_tasks
  FOR UPDATE USING (auth.uid() = assigned_to OR public.hammer_has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins create tasks" ON public.hammer_tasks
  FOR INSERT WITH CHECK (public.hammer_has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete tasks" ON public.hammer_tasks
  FOR DELETE USING (public.hammer_has_role(auth.uid(), 'admin'));

-- hammer_goals
CREATE POLICY "Auth read goals" ON public.hammer_goals
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage goals" ON public.hammer_goals
  FOR ALL USING (public.hammer_has_role(auth.uid(), 'admin'))
  WITH CHECK (public.hammer_has_role(auth.uid(), 'admin'));

-- hammer_sales: all authenticated can see (ranking), only admins manage
CREATE POLICY "Auth read sales" ON public.hammer_sales
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage sales" ON public.hammer_sales
  FOR ALL USING (public.hammer_has_role(auth.uid(), 'admin'))
  WITH CHECK (public.hammer_has_role(auth.uid(), 'admin'));

-- hammer_notifications
CREATE POLICY "Users read own notifications" ON public.hammer_notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.hammer_notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone create notifications" ON public.hammer_notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============ TRIGGERS ============
CREATE TRIGGER hammer_profiles_set_updated_at
BEFORE UPDATE ON public.hammer_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar hammer_profile + role 'employee' ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_hammer_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.hammer_profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.hammer_roles (user_id, role)
  VALUES (NEW.id, 'employee')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_hammer
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_hammer_user();

-- Realtime
ALTER TABLE public.hammer_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.hammer_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.hammer_sales REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.hammer_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hammer_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hammer_sales;

-- Storage bucket para evidências
INSERT INTO storage.buckets (id, name, public) VALUES ('hammer-evidence', 'hammer-evidence', true);

CREATE POLICY "Evidence public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'hammer-evidence');
CREATE POLICY "Auth users upload evidence" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hammer-evidence');

-- Seed dos setores
INSERT INTO public.hammer_sectors (name, description, color) VALUES
  ('Recepção', 'Atendimento ao cliente e gestão de entradas', '#3b82f6'),
  ('Limpeza', 'Higienização e organização do espaço', '#10b981'),
  ('Manutenção', 'Reparos e conservação de equipamentos', '#f59e0b'),
  ('Comercial', 'Vendas e relacionamento com leads', '#f7931e');
