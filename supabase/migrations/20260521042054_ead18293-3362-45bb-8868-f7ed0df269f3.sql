-- Phase 6: Complete Database Schema

-- 1. Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role public.app_role NOT NULL,
    module TEXT NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(role, module)
);

-- Enable RLS for permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permissions viewable by all authenticated users"
ON public.permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage permissions"
ON public.permissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Create users table (extending/replacing profiles)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        CREATE TABLE public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role public.app_role DEFAULT 'receptionist',
            avatar_url TEXT,
            phone TEXT,
            cpf TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT now()
        );
        
        -- Migrate from profiles if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
            INSERT INTO public.users (id, name, email, avatar_url, created_at)
            SELECT p.id, COALESCE(p.full_name, 'User'), u.email, p.avatar_url, p.updated_at
            FROM public.profiles p
            JOIN auth.users u ON p.id = u.id
            ON CONFLICT (id) DO NOTHING;
            
            -- Also try to pull data from receptionists if it exists
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receptionists' AND table_schema = 'public') THEN
                UPDATE public.users u
                SET 
                    phone = r.phone,
                    cpf = r.cpf,
                    status = COALESCE(r.status::text, 'active'),
                    role = 'receptionist'
                FROM public.receptionists r
                WHERE u.id = r.user_id;
            END IF;
        END IF;
    END IF;
END $$;

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all users"
ON public.users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
ON public.users FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Rename daily_goals to goals
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_goals' AND table_schema = 'public') THEN
        ALTER TABLE public.daily_goals RENAME TO goals;
    END IF;
END $$;

-- 4. Trigger for auth.users -> public.users sync
CREATE OR REPLACE FUNCTION public.handle_new_user_v2()
RETURNS TRIGGER AS $$
DECLARE
    default_role public.app_role;
BEGIN
    default_role := COALESCE((new.raw_user_meta_data->>'role')::public.app_role, 'receptionist');
    
    INSERT INTO public.users (id, name, email, avatar_url, role, status)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'), 
        new.email, 
        new.raw_user_meta_data->>'avatar_url',
        default_role,
        'active'
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        role = EXCLUDED.role;
        
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users;
CREATE TRIGGER on_auth_user_created_v2
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_v2();

-- 5. Add default permissions
INSERT INTO public.permissions (role, module, can_view, can_create, can_edit, can_delete)
VALUES 
    ('admin', 'users', true, true, true, true),
    ('admin', 'sales', true, true, true, true),
    ('admin', 'goals', true, true, true, true),
    ('admin', 'cash_sessions', true, true, true, true),
    ('receptionist', 'sales', true, true, false, false),
    ('receptionist', 'goals', true, false, false, false),
    ('receptionist', 'cash_sessions', true, true, true, false)
ON CONFLICT (role, module) DO NOTHING;
