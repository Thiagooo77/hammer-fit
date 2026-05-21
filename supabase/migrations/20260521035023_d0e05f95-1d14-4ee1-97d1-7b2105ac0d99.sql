-- Add new fields to receptionists table
DO $$ BEGIN
  CREATE TYPE receptionist_status AS ENUM ('active', 'vacation', 'blocked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.receptionists
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS role_title TEXT,
  ADD COLUMN IF NOT EXISTS shift TEXT,
  ADD COLUMN IF NOT EXISTS status receptionist_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS idx_receptionists_user_id ON public.receptionists(user_id);
CREATE INDEX IF NOT EXISTS idx_receptionists_status ON public.receptionists(status);

-- Avatars bucket for receptionist photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('receptionist-avatars', 'receptionist-avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Avatars are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'receptionist-avatars');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage avatars"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'receptionist-avatars' AND has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (bucket_id = 'receptionist-avatars' AND has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN null; END $$;
