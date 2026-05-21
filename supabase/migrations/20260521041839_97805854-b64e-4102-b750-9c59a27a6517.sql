-- 1. Replace sales INSERT policy with an ownership check
DROP POLICY IF EXISTS "Users insert sales into open sessions" ON public.sales;

CREATE POLICY "Users insert sales into own open sessions"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.cash_sessions cs
    JOIN public.receptionists r ON r.id = cs.receptionist_id
    WHERE cs.id = sales.cash_session_id
      AND cs.status = 'open'::public.cash_session_status
      AND (
        r.user_id = auth.uid()
        OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
  )
);

-- 2. Admin-only write policies on goal_progress (writes normally happen via triggers/service role)
DROP POLICY IF EXISTS "Admins insert goal progress" ON public.goal_progress;
DROP POLICY IF EXISTS "Admins update goal progress" ON public.goal_progress;
DROP POLICY IF EXISTS "Admins delete goal progress" ON public.goal_progress;

CREATE POLICY "Admins insert goal progress"
ON public.goal_progress
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update goal progress"
ON public.goal_progress
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete goal progress"
ON public.goal_progress
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));