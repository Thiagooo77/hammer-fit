-- Prevent authenticated users from escalating privileges by changing their own role
CREATE OR REPLACE FUNCTION public.prevent_user_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_user_role_self_escalation_trigger ON public.users;
CREATE TRIGGER prevent_user_role_self_escalation_trigger
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_role_self_escalation();

-- Make meal photo uploads explicitly authenticated-only
ALTER POLICY "Users can upload meal photos"
ON storage.objects
TO authenticated;