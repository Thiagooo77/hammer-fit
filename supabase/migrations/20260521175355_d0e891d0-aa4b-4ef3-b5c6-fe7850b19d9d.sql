
DROP TRIGGER IF EXISTS on_receptionist_created ON public.receptionists;

CREATE OR REPLACE FUNCTION public.initialize_receptionist_goal_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.goal_progress (receptionist_id, goal_amount, sold_amount)
  VALUES (NEW.id, COALESCE(NEW.goal_value, 0), 0)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_receptionist_created
AFTER INSERT ON public.receptionists
FOR EACH ROW EXECUTE FUNCTION public.initialize_receptionist_goal_progress();

-- Replace role: remove any existing role and set receptionist
DELETE FROM public.user_roles WHERE user_id = '04628413-d909-425c-9d77-dd1f93bba294';
INSERT INTO public.user_roles (user_id, role)
VALUES ('04628413-d909-425c-9d77-dd1f93bba294', 'receptionist'::app_role);

INSERT INTO public.receptionists (user_id, name, email, status, active)
VALUES ('04628413-d909-425c-9d77-dd1f93bba294', 'Eduardo Souza', 'es73896@gmail.com', 'active', true)
ON CONFLICT DO NOTHING;

UPDATE public.users
SET name = 'Eduardo Souza', role = 'receptionist'
WHERE id = '04628413-d909-425c-9d77-dd1f93bba294';
