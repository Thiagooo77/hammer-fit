
CREATE OR REPLACE FUNCTION public.calc_time_bank_on_punch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_horario_entrada time;
  v_horario_saida time;
  v_company_id uuid;
  v_date date;
  v_entrada timestamptz;
  v_saida timestamptz;
  v_almoco_saida timestamptz;
  v_almoco_retorno timestamptz;
  v_worked_seconds numeric;
  v_scheduled_seconds numeric;
  v_lunch_seconds numeric;
  v_diff_hours numeric;
  v_kind time_bank_kind;
BEGIN
  IF NEW.punch_type <> 'saida' THEN
    RETURN NEW;
  END IF;

  v_date := (NEW.punched_at)::date;

  SELECT horario_entrada, horario_saida, company_id
    INTO v_horario_entrada, v_horario_saida, v_company_id
    FROM public.profiles
    WHERE id = NEW.user_id;

  IF v_horario_entrada IS NULL OR v_horario_saida IS NULL OR v_company_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT MIN(punched_at) FILTER (WHERE punch_type = 'entrada'),
         MAX(punched_at) FILTER (WHERE punch_type = 'saida'),
         MIN(punched_at) FILTER (WHERE punch_type = 'almoco_saida'),
         MAX(punched_at) FILTER (WHERE punch_type = 'almoco_retorno')
    INTO v_entrada, v_saida, v_almoco_saida, v_almoco_retorno
    FROM public.punches
    WHERE user_id = NEW.user_id
      AND punched_at::date = v_date;

  IF v_entrada IS NULL OR v_saida IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_almoco_saida IS NOT NULL AND v_almoco_retorno IS NOT NULL THEN
    v_lunch_seconds := EXTRACT(EPOCH FROM (v_almoco_retorno - v_almoco_saida));
  ELSE
    v_lunch_seconds := 3600;
  END IF;

  v_worked_seconds := EXTRACT(EPOCH FROM (v_saida - v_entrada)) - v_lunch_seconds;
  v_scheduled_seconds := EXTRACT(EPOCH FROM (v_horario_saida - v_horario_entrada)) - 3600;

  v_diff_hours := ROUND(((v_worked_seconds - v_scheduled_seconds) / 3600.0)::numeric, 2);

  DELETE FROM public.time_bank
    WHERE user_id = NEW.user_id
      AND reference_date = v_date
      AND notes LIKE '[auto]%';

  IF v_diff_hours = 0 THEN
    RETURN NEW;
  END IF;

  IF v_diff_hours > 0 THEN
    v_kind := 'extra';
  ELSE
    v_kind := 'devedora';
  END IF;

  INSERT INTO public.time_bank (user_id, company_id, kind, hours, reference_date, notes, approved)
  VALUES (
    NEW.user_id,
    v_company_id,
    v_kind,
    ABS(v_diff_hours),
    v_date,
    '[auto] Cálculo automático após saída',
    true
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calc_time_bank ON public.punches;
CREATE TRIGGER trg_calc_time_bank
  AFTER INSERT ON public.punches
  FOR EACH ROW
  EXECUTE FUNCTION public.calc_time_bank_on_punch();
