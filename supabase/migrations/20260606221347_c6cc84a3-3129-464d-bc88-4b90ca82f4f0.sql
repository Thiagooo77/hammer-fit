CREATE POLICY "Admins gerenciam payslips storage"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'payslips' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'payslips' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Colaborador le proprio holerite storage"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payslips'
  AND EXISTS (
    SELECT 1 FROM public.payslips p
    WHERE p.pdf_url = storage.objects.name
      AND p.user_id = auth.uid()
      AND p.released = true
  )
);