
-- Storage policies: authenticated users can manage their own files in receptionist-avatars
CREATE POLICY "Users upload own avatar" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receptionist-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own avatar" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'receptionist-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own avatar" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'receptionist-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RPC: update own avatar url on receptionists and users tables
CREATE OR REPLACE FUNCTION public.update_my_avatar(p_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.receptionists SET avatar_url = p_url WHERE user_id = auth.uid();
  UPDATE public.users SET avatar_url = p_url WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_avatar(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_avatar(text) TO authenticated;
