
-- 1. hammer_notifications: only admins or self can insert
DROP POLICY IF EXISTS "Anyone create notifications" ON public.hammer_notifications;
CREATE POLICY "Insert own or admin notifications"
ON public.hammer_notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.hammer_has_role(auth.uid(), 'admin'::hammer_role));

-- 2. hammer_sales: only own rows or admins can read
DROP POLICY IF EXISTS "Auth read sales" ON public.hammer_sales;
CREATE POLICY "Sales read own or admin"
ON public.hammer_sales
FOR SELECT
TO authenticated
USING (auth.uid() = employee_id OR public.hammer_has_role(auth.uid(), 'admin'::hammer_role));

-- 3. community_posts/likes: authenticated only
DROP POLICY IF EXISTS "view posts" ON public.community_posts;
CREATE POLICY "view posts"
ON public.community_posts
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "view likes" ON public.community_likes;
CREATE POLICY "view likes"
ON public.community_likes
FOR SELECT
TO authenticated
USING (true);

-- 4. update_updated_at_column: set immutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 5. hammer-evidence storage: restrict reads to authenticated, scope uploads by user folder
DROP POLICY IF EXISTS "Evidence read by name" ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload evidence" ON storage.objects;

CREATE POLICY "Evidence read authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'hammer-evidence');

CREATE POLICY "Evidence upload own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hammer-evidence'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Evidence update own folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'hammer-evidence'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Evidence delete own or admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'hammer-evidence'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.hammer_has_role(auth.uid(), 'admin'::hammer_role)
  )
);

-- Make the evidence bucket private (still served via authenticated requests / signed URLs)
UPDATE storage.buckets SET public = false WHERE id = 'hammer-evidence';

-- 6. realtime.messages: gate broadcast/presence subscriptions to authenticated users
-- (postgres_changes uses the underlying table RLS and is unaffected)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'realtime' AND tablename = 'messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can read realtime" ON realtime.messages';
    EXECUTE 'CREATE POLICY "Authenticated can read realtime" ON realtime.messages FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;
