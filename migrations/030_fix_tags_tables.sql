-- Fix Tags Tables Structure
-- This migration creates the proper tags tables structure

-- Create user_tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_tags (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_tag_relations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_tag_relations (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    tag_id UUID REFERENCES user_tags(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tags table if it doesn't exist (for event tags)
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to existing tables
DO $$
BEGIN
    -- Add columns to user_tags if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_tags' AND column_name = 'description') THEN
        ALTER TABLE public.user_tags ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_tags' AND column_name = 'color') THEN
        ALTER TABLE public.user_tags ADD COLUMN color VARCHAR(7) DEFAULT '#3B82F6';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_tags' AND column_name = 'updated_at') THEN
        ALTER TABLE public.user_tags ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add columns to tags if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tags' AND column_name = 'description') THEN
        ALTER TABLE public.tags ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tags' AND column_name = 'color') THEN
        ALTER TABLE public.tags ADD COLUMN color VARCHAR(7) DEFAULT '#3B82F6';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tags' AND column_name = 'type') THEN
        ALTER TABLE public.tags ADD COLUMN type VARCHAR(50) DEFAULT 'event';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tags' AND column_name = 'updated_at') THEN
        ALTER TABLE public.tags ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add unique constraint to user_tag_relations if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'user_tag_relations' AND constraint_name = 'user_tag_relations_tag_id_user_id_key') THEN
        ALTER TABLE public.user_tag_relations ADD CONSTRAINT user_tag_relations_tag_id_user_id_key UNIQUE(tag_id, user_id);
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tag_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Drop policies for user_tags
    DROP POLICY IF EXISTS "Users can view user tags" ON public.user_tags;
    DROP POLICY IF EXISTS "Users can insert user tags" ON public.user_tags;
    DROP POLICY IF EXISTS "Users can update user tags" ON public.user_tags;
    DROP POLICY IF EXISTS "Users can delete user tags" ON public.user_tags;
    
    -- Drop policies for user_tag_relations
    DROP POLICY IF EXISTS "Users can view user tag relations" ON public.user_tag_relations;
    DROP POLICY IF EXISTS "Users can insert user tag relations" ON public.user_tag_relations;
    DROP POLICY IF EXISTS "Users can update user tag relations" ON public.user_tag_relations;
    DROP POLICY IF EXISTS "Users can delete user tag relations" ON public.user_tag_relations;
    
    -- Drop policies for tags
    DROP POLICY IF EXISTS "Users can view tags" ON public.tags;
    DROP POLICY IF EXISTS "Users can insert tags" ON public.tags;
    DROP POLICY IF EXISTS "Users can update tags" ON public.tags;
    DROP POLICY IF EXISTS "Users can delete tags" ON public.tags;
END $$;

-- Create RLS policies for user_tags
CREATE POLICY "Users can view user tags" ON public.user_tags
    FOR SELECT USING (true);

CREATE POLICY "Users can insert user tags" ON public.user_tags
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update user tags" ON public.user_tags
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete user tags" ON public.user_tags
    FOR DELETE USING (true);

-- Create RLS policies for user_tag_relations
CREATE POLICY "Users can view user tag relations" ON public.user_tag_relations
    FOR SELECT USING (true);

CREATE POLICY "Users can insert user tag relations" ON public.user_tag_relations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update user tag relations" ON public.user_tag_relations
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete user tag relations" ON public.user_tag_relations
    FOR DELETE USING (true);

-- Create RLS policies for tags
CREATE POLICY "Users can view tags" ON public.tags
    FOR SELECT USING (true);

CREATE POLICY "Users can insert tags" ON public.tags
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update tags" ON public.tags
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete tags" ON public.tags
    FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tags_tenant_id ON public.user_tags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_name ON public.user_tags(name);

CREATE INDEX IF NOT EXISTS idx_user_tag_relations_tag_id ON public.user_tag_relations(tag_id);
CREATE INDEX IF NOT EXISTS idx_user_tag_relations_user_id ON public.user_tag_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tag_relations_tenant_id ON public.user_tag_relations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tags_tenant_id ON public.tags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

-- Add type index only if type column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tags' AND column_name = 'type') THEN
        CREATE INDEX IF NOT EXISTS idx_tags_type ON public.tags(type);
    END IF;
END $$;

-- Insert sample data if tables are empty
DO $$
DECLARE
    sample_tenant_id UUID;
BEGIN
    -- Get the first tenant ID
    SELECT id INTO sample_tenant_id FROM tenants LIMIT 1;
    
    IF sample_tenant_id IS NOT NULL THEN
        -- Insert sample event tags (only if table is empty)
        IF NOT EXISTS (SELECT 1 FROM public.tags LIMIT 1) THEN
            -- Check if type column exists
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'tags' AND column_name = 'type') THEN
                INSERT INTO public.tags (name, description, color, type, tenant_id)
                VALUES 
                    ('Concierto', 'Eventos musicales', '#FF6B6B', 'event', sample_tenant_id),
                    ('Teatro', 'Obras de teatro', '#4ECDC4', 'event', sample_tenant_id),
                    ('Deportes', 'Eventos deportivos', '#45B7D1', 'event', sample_tenant_id),
                    ('Festival', 'Festivales y eventos especiales', '#96CEB4', 'event', sample_tenant_id),
                    ('Conferencia', 'Conferencias y seminarios', '#FFEAA7', 'event', sample_tenant_id);
            ELSE
                INSERT INTO public.tags (name, description, color, tenant_id)
                VALUES 
                    ('Concierto', 'Eventos musicales', '#FF6B6B', sample_tenant_id),
                    ('Teatro', 'Obras de teatro', '#4ECDC4', sample_tenant_id),
                    ('Deportes', 'Eventos deportivos', '#45B7D1', sample_tenant_id),
                    ('Festival', 'Festivales y eventos especiales', '#96CEB4', sample_tenant_id),
                    ('Conferencia', 'Conferencias y seminarios', '#FFEAA7', sample_tenant_id);
            END IF;
        END IF;
        
        -- Insert sample user tags (only if table is empty)
        IF NOT EXISTS (SELECT 1 FROM public.user_tags LIMIT 1) THEN
            INSERT INTO public.user_tags (name, description, color, tenant_id)
            VALUES 
                ('VIP', 'Clientes VIP', '#FFD700', sample_tenant_id),
                ('Frecuente', 'Compradores frecuentes', '#32CD32', sample_tenant_id),
                ('Nuevo', 'Clientes nuevos', '#FF6347', sample_tenant_id),
                ('Premium', 'Clientes premium', '#8A2BE2', sample_tenant_id),
                ('Grupo', 'Compradores grupales', '#20B2AA', sample_tenant_id);
        END IF;
        
        RAISE NOTICE 'Sample tags data inserted for tenant: %', sample_tenant_id;
    ELSE
        RAISE NOTICE 'No tenants found, skipping sample data insertion';
    END IF;
END $$;
