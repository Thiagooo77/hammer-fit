
-- 1) Fix evidence bucket: only owner or admin can read their files
DROP POLICY IF EXISTS "Evidence read authenticated" ON storage.objects;

CREATE POLICY "Evidence read own or admin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'hammer-evidence'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.hammer_has_role(auth.uid(), 'admin'::public.hammer_role)
  )
);

-- 2) Lock down trigger-only SECURITY DEFINER functions from being called by clients
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_hammer_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 3) Tighten hammer_has_role: still callable by authenticated (needed for RLS), but not anon
REVOKE EXECUTE ON FUNCTION public.hammer_has_role(uuid, public.hammer_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hammer_has_role(uuid, public.hammer_role) TO authenticated;

-- 4) Defense-in-depth: only admins (or signup trigger via SECURITY DEFINER) may write to hammer_roles
-- The existing "Admins manage roles" policy already blocks self-elevation; ensure no permissive insert path remains.
-- (No DDL changes needed — the policy set is correct. Self-assignment in client code is being removed in the same PR.)
