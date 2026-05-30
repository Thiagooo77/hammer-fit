-- hammer-evidence: SELECT and DELETE scoped to owner folder
CREATE POLICY "hammer_evidence_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'hammer-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "hammer_evidence_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'hammer-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

-- meals: UPDATE and DELETE scoped to owner folder
CREATE POLICY "meals_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'meals' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'meals' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "meals_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'meals' AND (storage.foldername(name))[1] = auth.uid()::text);