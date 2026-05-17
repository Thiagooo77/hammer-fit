
-- Revoga execução pública da função de roles
REVOKE EXECUTE ON FUNCTION public.hammer_has_role(UUID, hammer_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hammer_has_role(UUID, hammer_role) TO authenticated;

-- Restringe a leitura do bucket: permite acessar arquivos por URL direta, mas evita listagem ampla
DROP POLICY IF EXISTS "Evidence public read" ON storage.objects;
CREATE POLICY "Evidence read by name" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'hammer-evidence' AND name IS NOT NULL);
