-- 1. AUDIT_LOGS: Remove client-side insert; only service role can insert
REVOKE INSERT ON public.audit_logs FROM authenticated, anon;

-- 2. RECEPTIONISTS: Restrict PII access
DROP POLICY IF EXISTS "Receptionists viewable by all" ON public.receptionists;

CREATE POLICY "Admins and managers can view all receptionists"
ON public.receptionists FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Receptionists can view their own record"
ON public.receptionists FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. USERS: Restrict PII access (already has admin policy, need to fix the open one)
DROP POLICY IF EXISTS "Users can view all users" ON public.users;

CREATE POLICY "Users can view their own data"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins and managers can view all users"
ON public.users FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
);