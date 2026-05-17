
-- Add is_recurring to hammer_tasks
ALTER TABLE public.hammer_tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_hammer_tasks_is_recurring ON public.hammer_tasks(is_recurring);

-- Ensure hammer_roles has a check constraint for valid roles
-- First check if it exists, otherwise add it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hammer_roles_role_check') THEN
        ALTER TABLE public.hammer_roles ADD CONSTRAINT hammer_roles_role_check CHECK (role IN ('admin', 'employee'));
    END IF;
END $$;
