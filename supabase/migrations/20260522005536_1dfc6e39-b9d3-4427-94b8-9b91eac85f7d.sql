CREATE OR REPLACE FUNCTION public.block_sales_after_close()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' AND EXISTS (
    SELECT 1 FROM public.cash_sessions
    WHERE id = NEW.cash_session_id AND status = 'closed'
  ) THEN
    RAISE EXCEPTION 'Cannot add sale to closed session';
  END IF;
  RETURN NEW;
END;
$$;