
-- onboarding_data: add owner-scoped INSERT/UPDATE/DELETE policies
CREATE POLICY "Users insert own onboarding"
ON public.onboarding_data FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own onboarding"
ON public.onboarding_data FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own onboarding"
ON public.onboarding_data FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Tighten realtime.messages: scope subscriptions to the user's own topics
DROP POLICY IF EXISTS "Authenticated can read realtime" ON realtime.messages;

CREATE POLICY "Realtime own topics or admin"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  -- User's own user-id-suffixed channels (e.g., 'notifications:<uuid>')
  realtime.topic() LIKE '%' || (auth.uid())::text || '%'
  -- Or admin listening on any hammer channel
  OR public.hammer_has_role(auth.uid(), 'admin'::public.hammer_role)
);
