CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  actor_id uuid;
  record_payload jsonb;
  record_id text;
BEGIN
  actor_id := auth.uid();
  record_payload := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  record_id := record_payload ->> 'id';

  INSERT INTO public.audit_logs (
    user_id,
    action_type,
    module,
    description,
    old_data,
    new_data
  ) VALUES (
    actor_id,
    lower(TG_OP),
    TG_TABLE_NAME,
    concat(TG_OP, ' em ', TG_TABLE_NAME, COALESCE(' #' || record_id, '')),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;