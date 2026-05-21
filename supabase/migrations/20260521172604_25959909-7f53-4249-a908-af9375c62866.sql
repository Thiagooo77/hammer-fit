-- 1. Update Admin Name
UPDATE public.users 
SET name = 'EDUARDO SOUZA' 
WHERE email = 'admhammer@gmail.com';

-- 2. Create Checklist Shift Type
DO $$ BEGIN
    CREATE TYPE checklist_shift AS ENUM ('morning', 'afternoon', 'night', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Checklists Table
CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  shift checklist_shift NOT NULL DEFAULT 'general',
  assigned_to UUID REFERENCES public.receptionists(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. Enable RLS
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Anyone authenticated can view checklists"
ON public.checklists FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and managers can manage checklists"
ON public.checklists FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Receptionists can update status of assigned checklists"
ON public.checklists FOR UPDATE
TO authenticated
USING (
  assigned_to IN (SELECT id FROM public.receptionists WHERE user_id = auth.uid())
)
WITH CHECK (
  assigned_to IN (SELECT id FROM public.receptionists WHERE user_id = auth.uid())
);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.checklists
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();