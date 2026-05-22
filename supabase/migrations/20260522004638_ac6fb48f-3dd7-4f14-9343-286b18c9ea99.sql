ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS hidden_by UUID NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS hidden_reason TEXT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_hidden_at ON public.sales (hidden_at);