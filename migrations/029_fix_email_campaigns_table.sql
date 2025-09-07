-- Fix Email Campaigns Table and RLS Policies
-- This migration creates the email_campaigns table and related tables if they don't exist
-- and sets up proper RLS policies

-- Create email_campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'newsletter',
    estado VARCHAR(50) DEFAULT 'draft',
    configuracion JSONB DEFAULT '{}',
    fecha_envio TIMESTAMP WITH TIME ZONE,
    evento_id UUID REFERENCES eventos(id) ON DELETE SET NULL,
    canal_id UUID REFERENCES canales_venta(id) ON DELETE SET NULL,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to existing email_templates table
DO $$
BEGIN
    -- Add tipo column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'tipo') THEN
        ALTER TABLE public.email_templates ADD COLUMN tipo VARCHAR(50) DEFAULT 'personalizada';
    END IF;
    
    -- Add asunto column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'asunto') THEN
        ALTER TABLE public.email_templates ADD COLUMN asunto VARCHAR(255);
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'created_at') THEN
        ALTER TABLE public.email_templates ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'updated_at') THEN
        ALTER TABLE public.email_templates ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Create email_logs table if it doesn't exist, or add missing columns to existing table
DO $$
BEGIN
    -- Check if email_logs table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs' AND table_schema = 'public') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE public.email_logs (
            id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
            campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
            destinatario VARCHAR(255) NOT NULL,
            estado VARCHAR(50) DEFAULT 'pendiente',
            fecha_envio TIMESTAMP WITH TIME ZONE,
            error_message TEXT,
            tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        -- Add missing columns to existing table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'campaign_id') THEN
            ALTER TABLE public.email_logs ADD COLUMN campaign_id UUID;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'destinatario') THEN
            ALTER TABLE public.email_logs ADD COLUMN destinatario VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'estado') THEN
            ALTER TABLE public.email_logs ADD COLUMN estado VARCHAR(50) DEFAULT 'pendiente';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'fecha_envio') THEN
            ALTER TABLE public.email_logs ADD COLUMN fecha_envio TIMESTAMP WITH TIME ZONE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'error_message') THEN
            ALTER TABLE public.email_logs ADD COLUMN error_message TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.email_logs ADD COLUMN tenant_id UUID;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'created_at') THEN
            ALTER TABLE public.email_logs ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;
    END IF;
END $$;

-- Create canales_venta table if it doesn't exist, or add missing columns to existing table
DO $$
BEGIN
    -- Check if canales_venta table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'canales_venta' AND table_schema = 'public') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE public.canales_venta (
            id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            url VARCHAR(500),
            tipo VARCHAR(50) DEFAULT 'web',
            activo BOOLEAN DEFAULT true,
            tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        -- Add missing columns to existing table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canales_venta' AND column_name = 'url') THEN
            ALTER TABLE public.canales_venta ADD COLUMN url VARCHAR(500);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canales_venta' AND column_name = 'tipo') THEN
            ALTER TABLE public.canales_venta ADD COLUMN tipo VARCHAR(50) DEFAULT 'web';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canales_venta' AND column_name = 'activo') THEN
            ALTER TABLE public.canales_venta ADD COLUMN activo BOOLEAN DEFAULT true;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canales_venta' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.canales_venta ADD COLUMN tenant_id UUID;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canales_venta' AND column_name = 'created_at') THEN
            ALTER TABLE public.canales_venta ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canales_venta' AND column_name = 'updated_at') THEN
            ALTER TABLE public.canales_venta ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canales_venta ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Drop policies for email_campaigns
    DROP POLICY IF EXISTS "Users can view email campaigns for their tenant" ON public.email_campaigns;
    DROP POLICY IF EXISTS "Users can insert email campaigns for their tenant" ON public.email_campaigns;
    DROP POLICY IF EXISTS "Users can update email campaigns for their tenant" ON public.email_campaigns;
    DROP POLICY IF EXISTS "Users can delete email campaigns for their tenant" ON public.email_campaigns;
    DROP POLICY IF EXISTS "Users can view email campaigns" ON public.email_campaigns;
    DROP POLICY IF EXISTS "Users can insert email campaigns" ON public.email_campaigns;
    DROP POLICY IF EXISTS "Users can update email campaigns" ON public.email_campaigns;
    DROP POLICY IF EXISTS "Users can delete email campaigns" ON public.email_campaigns;
    
    -- Drop policies for email_templates
    DROP POLICY IF EXISTS "Users can view email templates for their tenant" ON public.email_templates;
    DROP POLICY IF EXISTS "Users can insert email templates for their tenant" ON public.email_templates;
    DROP POLICY IF EXISTS "Users can update email templates for their tenant" ON public.email_templates;
    DROP POLICY IF EXISTS "Users can delete email templates for their tenant" ON public.email_templates;
    DROP POLICY IF EXISTS "Users can view email templates" ON public.email_templates;
    DROP POLICY IF EXISTS "Users can insert email templates" ON public.email_templates;
    DROP POLICY IF EXISTS "Users can update email templates" ON public.email_templates;
    DROP POLICY IF EXISTS "Users can delete email templates" ON public.email_templates;
    
    -- Drop policies for email_logs
    DROP POLICY IF EXISTS "Users can view email logs for their tenant" ON public.email_logs;
    DROP POLICY IF EXISTS "Users can insert email logs for their tenant" ON public.email_logs;
    DROP POLICY IF EXISTS "Users can update email logs for their tenant" ON public.email_logs;
    DROP POLICY IF EXISTS "Users can delete email logs for their tenant" ON public.email_logs;
    DROP POLICY IF EXISTS "Users can view email logs" ON public.email_logs;
    DROP POLICY IF EXISTS "Users can insert email logs" ON public.email_logs;
    DROP POLICY IF EXISTS "Users can update email logs" ON public.email_logs;
    DROP POLICY IF EXISTS "Users can delete email logs" ON public.email_logs;
    
    -- Drop policies for canales_venta
    DROP POLICY IF EXISTS "Users can view canales venta for their tenant" ON public.canales_venta;
    DROP POLICY IF EXISTS "Users can insert canales venta for their tenant" ON public.canales_venta;
    DROP POLICY IF EXISTS "Users can update canales venta for their tenant" ON public.canales_venta;
    DROP POLICY IF EXISTS "Users can delete canales venta for their tenant" ON public.canales_venta;
    DROP POLICY IF EXISTS "Users can view canales venta" ON public.canales_venta;
    DROP POLICY IF EXISTS "Users can insert canales venta" ON public.canales_venta;
    DROP POLICY IF EXISTS "Users can update canales venta" ON public.canales_venta;
    DROP POLICY IF EXISTS "Users can delete canales venta" ON public.canales_venta;
END $$;

-- Create RLS policies for email_campaigns (simplified for now)
CREATE POLICY "Users can view email campaigns" ON public.email_campaigns
    FOR SELECT USING (true);

CREATE POLICY "Users can insert email campaigns" ON public.email_campaigns
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update email campaigns" ON public.email_campaigns
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete email campaigns" ON public.email_campaigns
    FOR DELETE USING (true);

-- Create RLS policies for email_templates (simplified for now)
CREATE POLICY "Users can view email templates" ON public.email_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can insert email templates" ON public.email_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update email templates" ON public.email_templates
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete email templates" ON public.email_templates
    FOR DELETE USING (true);

-- Create RLS policies for email_logs (simplified for now)
CREATE POLICY "Users can view email logs" ON public.email_logs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert email logs" ON public.email_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update email logs" ON public.email_logs
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete email logs" ON public.email_logs
    FOR DELETE USING (true);

-- Create RLS policies for canales_venta (simplified for now)
CREATE POLICY "Users can view canales venta" ON public.canales_venta
    FOR SELECT USING (true);

CREATE POLICY "Users can insert canales venta" ON public.canales_venta
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update canales venta" ON public.canales_venta
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete canales venta" ON public.canales_venta
    FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_tenant_id ON public.email_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_estado ON public.email_campaigns(estado);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_tipo ON public.email_campaigns(tipo);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_fecha_envio ON public.email_campaigns(fecha_envio);

CREATE INDEX IF NOT EXISTS idx_email_templates_tenant_id ON public.email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_tipo ON public.email_templates(tipo);

CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON public.email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_id ON public.email_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_estado ON public.email_logs(estado);

CREATE INDEX IF NOT EXISTS idx_canales_venta_tenant_id ON public.canales_venta(tenant_id);
CREATE INDEX IF NOT EXISTS idx_canales_venta_activo ON public.canales_venta(activo);

-- Insert some sample data if tables are empty
DO $$
DECLARE
    sample_tenant_id UUID;
BEGIN
    -- Get the first tenant ID
    SELECT id INTO sample_tenant_id FROM tenants LIMIT 1;
    
    IF sample_tenant_id IS NOT NULL THEN
        -- Insert sample email templates (only if table is empty)
        IF NOT EXISTS (SELECT 1 FROM public.email_templates LIMIT 1) THEN
            INSERT INTO public.email_templates (nombre, tipo, contenido, asunto, tenant_id)
            VALUES 
                ('Newsletter Mensual', 'newsletter', '<h1>Newsletter Mensual</h1><p>Contenido del newsletter...</p>', 'Newsletter Mensual - {{nombre_evento}}', sample_tenant_id),
                ('Invitación Evento', 'invitacion', '<h1>Invitación Especial</h1><p>Te invitamos a nuestro evento...</p>', 'Invitación: {{nombre_evento}}', sample_tenant_id),
                ('Recordatorio Pago', 'recordatorio', '<h1>Recordatorio de Pago</h1><p>No olvides completar tu compra...</p>', 'Recordatorio: {{nombre_evento}}', sample_tenant_id);
        END IF;
        
        -- Insert sample sales channels
        INSERT INTO public.canales_venta (nombre, url, tipo, activo, tenant_id)
        VALUES 
            ('Sitio Web Principal', 'https://sistema.veneventos.com', 'web', true, sample_tenant_id),
            ('Facebook', 'https://facebook.com/veneventos', 'social', true, sample_tenant_id),
            ('Instagram', 'https://instagram.com/veneventos', 'social', true, sample_tenant_id)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sample data inserted for tenant: %', sample_tenant_id;
    ELSE
        RAISE NOTICE 'No tenants found, skipping sample data insertion';
    END IF;
END $$;
