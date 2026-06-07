CREATE OR REPLACE FUNCTION public.calc_time_bank_on_punch()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_current_balance numeric;
  v_compensation numeric;
  v_remaining numeric;
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
    v_lunch_seconds := 1800;
  END IF;

  v_worked_seconds := EXTRACT(EPOCH FROM (v_saida - v_entrada)) - v_lunch_seconds;
  v_scheduled_seconds := EXTRACT(EPOCH FROM (v_horario_saida - v_horario_entrada)) - 1800;

  v_diff_hours := ROUND(((v_worked_seconds - v_scheduled_seconds) / 3600.0)::numeric, 2);

  DELETE FROM public.time_bank
    WHERE user_id = NEW.user_id
      AND reference_date = v_date
      AND notes LIKE '[auto]%';

  SELECT COALESCE(SUM(
    CASE WHEN kind = 'devedora' THEN -hours ELSE hours END
  ), 0)
    INTO v_current_balance
    FROM public.time_bank
    WHERE user_id = NEW.user_id;

  IF v_diff_hours = 0 THEN
    RETURN NEW;
  END IF;

  IF (v_current_balance > 0 AND v_diff_hours < 0) OR (v_current_balance < 0 AND v_diff_hours > 0) THEN
    v_compensation := LEAST(ABS(v_current_balance), ABS(v_diff_hours));
    v_remaining := ABS(v_diff_hours) - v_compensation;

    INSERT INTO public.time_bank (user_id, company_id, kind, hours, reference_date, notes, approved)
    VALUES (
      NEW.user_id, v_company_id, 'ajuste',
      CASE WHEN v_current_balance > 0 THEN -v_compensation ELSE v_compensation END,
      v_date,
      '[auto] Compensação automática (' || v_compensation::text || 'h)',
      true
    );

    IF v_remaining > 0 THEN
      INSERT INTO public.time_bank (user_id, company_id, kind, hours, reference_date, notes, approved)
      VALUES (
        NEW.user_id, v_company_id,
        CASE WHEN v_diff_hours > 0 THEN 'extra'::time_bank_kind ELSE 'devedora'::time_bank_kind END,
        v_remaining, v_date,
        '[auto] Saldo restante após compensação', true
      );
    END IF;
  ELSE
    INSERT INTO public.time_bank (user_id, company_id, kind, hours, reference_date, notes, approved)
    VALUES (
      NEW.user_id, v_company_id,
      CASE WHEN v_diff_hours > 0 THEN 'extra'::time_bank_kind ELSE 'devedora'::time_bank_kind END,
      ABS(v_diff_hours), v_date,
      '[auto] Cálculo automático após saída', true
    );
  END IF;

  RETURN NEW;
END;
$function$;