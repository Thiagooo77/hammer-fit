
-- 1. Drop overly-permissive duplicate SELECT policies
DROP POLICY IF EXISTS "Cash sessions viewable by all" ON public.cash_sessions;
DROP POLICY IF EXISTS "Sales viewable by all" ON public.sales;

-- 2. Prevent role escalation via self-update on users table
CREATE OR REPLACE FUNCTION public.prevent_user_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_prevent_role_self_escalation ON public.users;
CREATE TRIGGER users_prevent_role_self_escalation
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.prevent_user_role_self_escalation();

-- 3. Block direct writes to audit_logs from authenticated role (server-only via edge function)
DROP POLICY IF EXISTS "Block client audit inserts" ON public.audit_logs;
DROP POLICY IF EXISTS "Block client audit updates" ON public.audit_logs;
DROP POLICY IF EXISTS "Block client audit deletes" ON public.audit_logs;

CREATE POLICY "Block client audit inserts" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Block client audit updates" ON public.audit_logs
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Block client audit deletes" ON public.audit_logs
  FOR DELETE TO authenticated USING (false);

-- 4. Replace storage/realtime hammer_has_role(hammer_role) usages with has_role(app_role)
DROP POLICY IF EXISTS "Evidence delete own or admin" ON storage.objects;
DROP POLICY IF EXISTS "Evidence read own or admin" ON storage.objects;
DROP POLICY IF EXISTS "Realtime own topics or admin" ON realtime.messages;

CREATE POLICY "Evidence delete own or admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'hammer-evidence'
    AND (((storage.foldername(name))[1] = auth.uid()::text)
         OR public.has_role(auth.uid(), 'admin'::public.app_role))
  );

CREATE POLICY "Evidence read own or admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'hammer-evidence'
    AND (((storage.foldername(name))[1] = auth.uid()::text)
         OR public.has_role(auth.uid(), 'admin'::public.app_role))
  );

CREATE POLICY "Realtime own topics or admin" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    (realtime.topic() LIKE ('%' || auth.uid()::text || '%'))
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 5. Drop the unused hammer_has_role(hammer_role) overload to remove ambiguity
DROP FUNCTION IF EXISTS public.hammer_has_role(uuid, public.hammer_role);

-- 6. Set safe search_path on handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
