-- Fix Email Templates Types Migration
-- This migration fixes type compatibility issues in email templates tables

-- First, let's check if the tables exist and drop them if they do
DO $$
BEGIN
    -- Drop foreign key constraints first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_template_assets' AND table_schema = 'public') THEN
        ALTER TABLE public.email_template_assets DROP CONSTRAINT IF EXISTS email_template_assets_template_id_fkey;
        ALTER TABLE public.email_template_assets DROP CONSTRAINT IF EXISTS email_template_assets_tenant_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_template_variables' AND table_schema = 'public') THEN
        ALTER TABLE public.email_template_variables DROP CONSTRAINT IF EXISTS email_template_variables_template_id_fkey;
        ALTER TABLE public.email_template_variables DROP CONSTRAINT IF EXISTS email_template_variables_tenant_id_fkey;
    END IF;
    
    -- Drop tables if they exist
    DROP TABLE IF EXISTS public.email_template_assets CASCADE;
    DROP TABLE IF EXISTS public.email_template_variables CASCADE;
    DROP TABLE IF EXISTS public.email_templates CASCADE;
END $$;

-- Create email_templates table with consistent UUID types
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo_reporte VARCHAR(50) NOT NULL, -- 'sales', 'events', 'users', 'payments', etc.
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Design configuration
    configuracion_diseno JSONB DEFAULT '{
        "header": {
            "backgroundColor": "#1890ff",
            "textColor": "#ffffff",
            "logo": null,
            "title": "Reporte de Ventas",
            "subtitle": null
        },
        "body": {
            "backgroundColor": "#ffffff",
            "textColor": "#333333",
            "fontFamily": "Arial, sans-serif",
            "fontSize": "14px",
            "lineHeight": "1.6"
        },
        "footer": {
            "backgroundColor": "#f5f5f5",
            "textColor": "#666666",
            "text": "© 2024 Tu Empresa. Todos los derechos reservados.",
            "links": []
        },
        "colors": {
            "primary": "#1890ff",
            "secondary": "#52c41a",
            "success": "#52c41a",
            "warning": "#faad14",
            "error": "#ff4d4f",
            "info": "#1890ff"
        },
        "layout": {
            "maxWidth": "600px",
            "padding": "20px",
            "borderRadius": "8px",
            "boxShadow": "0 2px 8px rgba(0,0,0,0.1)"
        }
    }',
    
    -- Email content structure
    estructura_contenido JSONB DEFAULT '{
        "sections": [
            {
                "type": "header",
                "content": "Resumen del Reporte"
            },
            {
                "type": "summary",
                "content": "Estadísticas principales"
            },
            {
                "type": "table",
                "content": "Datos detallados"
            },
            {
                "type": "footer",
                "content": "Información adicional"
            }
        ]
    }',
    
    -- Template status and metadata
    activo BOOLEAN DEFAULT true,
    es_predeterminado BOOLEAN DEFAULT false,
    version VARCHAR(10) DEFAULT '1.0',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create email_template_assets table for storing images, logos, etc.
CREATE TABLE IF NOT EXISTS public.email_template_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Asset information
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'logo', 'image', 'icon', 'background'
    url TEXT NOT NULL,
    alt_text TEXT,
    
    -- Asset metadata
    width INTEGER,
    height INTEGER,
    size_bytes INTEGER,
    mime_type VARCHAR(100),
    
    -- Usage tracking
    usado_en JSONB DEFAULT '[]', -- Array of sections where this asset is used
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create email_template_variables table for dynamic content
CREATE TABLE IF NOT EXISTS public.email_template_variables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Variable definition
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'boolean', 'array'
    valor_predeterminado TEXT,
    descripcion TEXT,
    
    -- Variable configuration
    requerido BOOLEAN DEFAULT false,
    editable BOOLEAN DEFAULT true,
    opciones JSONB DEFAULT '[]', -- For select/radio options
    
    -- Usage in template
    usado_en JSONB DEFAULT '[]', -- Array of sections where this variable is used
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on all tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_template_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_template_variables ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Drop policies for email_templates
    DROP POLICY IF EXISTS "Users can view email templates" ON public.email_templates;
    DROP POLICY IF EXISTS "Users can insert email templates" ON public.email_templates;
    DROP POLICY IF EXISTS "Users can update email templates" ON public.email_templates;
    DROP POLICY IF EXISTS "Users can delete email templates" ON public.email_templates;
    
    -- Drop policies for email_template_assets
    DROP POLICY IF EXISTS "Users can view email template assets" ON public.email_template_assets;
    DROP POLICY IF EXISTS "Users can insert email template assets" ON public.email_template_assets;
    DROP POLICY IF EXISTS "Users can update email template assets" ON public.email_template_assets;
    DROP POLICY IF EXISTS "Users can delete email template assets" ON public.email_template_assets;
    
    -- Drop policies for email_template_variables
    DROP POLICY IF EXISTS "Users can view email template variables" ON public.email_template_variables;
    DROP POLICY IF EXISTS "Users can insert email template variables" ON public.email_template_variables;
    DROP POLICY IF EXISTS "Users can update email template variables" ON public.email_template_variables;
    DROP POLICY IF EXISTS "Users can delete email template variables" ON public.email_template_variables;
END $$;

-- Create RLS policies for email_templates
CREATE POLICY "Users can view email templates" ON public.email_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can insert email templates" ON public.email_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update email templates" ON public.email_templates
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete email templates" ON public.email_templates
    FOR DELETE USING (true);

-- Create RLS policies for email_template_assets
CREATE POLICY "Users can view email template assets" ON public.email_template_assets
    FOR SELECT USING (true);

CREATE POLICY "Users can insert email template assets" ON public.email_template_assets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update email template assets" ON public.email_template_assets
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete email template assets" ON public.email_template_assets
    FOR DELETE USING (true);

-- Create RLS policies for email_template_variables
CREATE POLICY "Users can view email template variables" ON public.email_template_variables
    FOR SELECT USING (true);

CREATE POLICY "Users can insert email template variables" ON public.email_template_variables
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update email template variables" ON public.email_template_variables
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete email template variables" ON public.email_template_variables
    FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant_id ON public.email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_tipo_reporte ON public.email_templates(tipo_reporte);
CREATE INDEX IF NOT EXISTS idx_email_templates_activo ON public.email_templates(activo);
CREATE INDEX IF NOT EXISTS idx_email_templates_es_predeterminado ON public.email_templates(es_predeterminado);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON public.email_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_email_template_assets_template_id ON public.email_template_assets(template_id);
CREATE INDEX IF NOT EXISTS idx_email_template_assets_tenant_id ON public.email_template_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_template_assets_tipo ON public.email_template_assets(tipo);

CREATE INDEX IF NOT EXISTS idx_email_template_variables_template_id ON public.email_template_variables(template_id);
CREATE INDEX IF NOT EXISTS idx_email_template_variables_tenant_id ON public.email_template_variables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_template_variables_nombre ON public.email_template_variables(nombre);

-- Insert default email templates for each report type
DO $$
DECLARE
    sample_tenant_id UUID;
    sample_user_id UUID;
BEGIN
    -- Get the first tenant ID
    SELECT id INTO sample_tenant_id FROM tenants LIMIT 1;
    
    -- Get the first user ID
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    IF sample_tenant_id IS NOT NULL AND sample_user_id IS NOT NULL THEN
        -- Insert default templates for each report type
        INSERT INTO public.email_templates (nombre, tipo_reporte, tenant_id, es_predeterminado, created_by)
        VALUES 
            ('Plantilla Ventas - Clásica', 'sales', sample_tenant_id, true, sample_user_id),
            ('Plantilla Eventos - Moderna', 'events', sample_tenant_id, true, sample_user_id),
            ('Plantilla Usuarios - Minimalista', 'users', sample_tenant_id, true, sample_user_id),
            ('Plantilla Pagos - Profesional', 'payments', sample_tenant_id, true, sample_user_id),
            ('Plantilla Productos - Elegante', 'products', sample_tenant_id, true, sample_user_id),
            ('Plantilla Promociones - Colorida', 'promociones', sample_tenant_id, true, sample_user_id),
            ('Plantilla Carritos - Simple', 'carritos', sample_tenant_id, true, sample_user_id)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Default email templates inserted for tenant: %', sample_tenant_id;
    ELSE
        RAISE NOTICE 'No tenants or users found, skipping default template insertion';
    END IF;
END $$;

-- Add comments to tables
COMMENT ON TABLE public.email_templates IS 'Customizable email templates for scheduled reports';
COMMENT ON TABLE public.email_template_assets IS 'Assets (images, logos) for email templates';
COMMENT ON TABLE public.email_template_variables IS 'Dynamic variables for email templates';
