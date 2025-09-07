-- Create Scheduled Email Reports System
-- This migration creates tables for scheduling email reports

-- Create scheduled_reports table
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo_reporte VARCHAR(50) NOT NULL, -- 'sales', 'events', 'users', 'payments', 'products', 'promociones', 'carritos'
    evento_id UUID REFERENCES eventos(id) ON DELETE SET NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    email_destinatarios TEXT NOT NULL, -- Comma-separated email list
    periodicidad VARCHAR(10) NOT NULL, -- 'daily', 'weekly', 'monthly'
    dias_semana INTEGER[], -- Array of days (1-7) for weekly reports
    dia_mes INTEGER, -- Day of month (1-31) for monthly reports
    hora_ejecucion TIME NOT NULL DEFAULT '08:00:00',
    idioma VARCHAR(10) DEFAULT 'es_MX',
    fechas_tipo VARCHAR(20) DEFAULT 'fixed', -- 'fixed' or 'sliding'
    activo BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create scheduled_report_executions table to track sent reports
CREATE TABLE IF NOT EXISTS public.scheduled_report_executions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    scheduled_report_id UUID REFERENCES scheduled_reports(id) ON DELETE CASCADE,
    fecha_ejecucion TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_reporte DATE NOT NULL, -- The date the report covers
    estado VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    email_enviado_a TEXT,
    archivo_generado TEXT, -- Path to generated report file
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create report_templates table for custom report configurations
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo_reporte VARCHAR(50) NOT NULL,
    configuracion JSONB DEFAULT '{}', -- Report configuration (filters, columns, etc.)
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on all tables
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_report_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Drop policies for scheduled_reports
    DROP POLICY IF EXISTS "Users can view scheduled reports" ON public.scheduled_reports;
    DROP POLICY IF EXISTS "Users can insert scheduled reports" ON public.scheduled_reports;
    DROP POLICY IF EXISTS "Users can update scheduled reports" ON public.scheduled_reports;
    DROP POLICY IF EXISTS "Users can delete scheduled reports" ON public.scheduled_reports;
    
    -- Drop policies for scheduled_report_executions
    DROP POLICY IF EXISTS "Users can view scheduled report executions" ON public.scheduled_report_executions;
    DROP POLICY IF EXISTS "Users can insert scheduled report executions" ON public.scheduled_report_executions;
    DROP POLICY IF EXISTS "Users can update scheduled report executions" ON public.scheduled_report_executions;
    DROP POLICY IF EXISTS "Users can delete scheduled report executions" ON public.scheduled_report_executions;
    
    -- Drop policies for report_templates
    DROP POLICY IF EXISTS "Users can view report templates" ON public.report_templates;
    DROP POLICY IF EXISTS "Users can insert report templates" ON public.report_templates;
    DROP POLICY IF EXISTS "Users can update report templates" ON public.report_templates;
    DROP POLICY IF EXISTS "Users can delete report templates" ON public.report_templates;
END $$;

-- Create RLS policies for scheduled_reports
CREATE POLICY "Users can view scheduled reports" ON public.scheduled_reports
    FOR SELECT USING (true);

CREATE POLICY "Users can insert scheduled reports" ON public.scheduled_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update scheduled reports" ON public.scheduled_reports
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete scheduled reports" ON public.scheduled_reports
    FOR DELETE USING (true);

-- Create RLS policies for scheduled_report_executions
CREATE POLICY "Users can view scheduled report executions" ON public.scheduled_report_executions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert scheduled report executions" ON public.scheduled_report_executions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update scheduled report executions" ON public.scheduled_report_executions
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete scheduled report executions" ON public.scheduled_report_executions
    FOR DELETE USING (true);

-- Create RLS policies for report_templates
CREATE POLICY "Users can view report templates" ON public.report_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can insert report templates" ON public.report_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update report templates" ON public.report_templates
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete report templates" ON public.report_templates
    FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_tenant_id ON public.scheduled_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_tipo_reporte ON public.scheduled_reports(tipo_reporte);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_evento_id ON public.scheduled_reports(evento_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_activo ON public.scheduled_reports(activo);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_created_by ON public.scheduled_reports(created_by);

CREATE INDEX IF NOT EXISTS idx_scheduled_report_executions_scheduled_report_id ON public.scheduled_report_executions(scheduled_report_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_report_executions_fecha_ejecucion ON public.scheduled_report_executions(fecha_ejecucion);
CREATE INDEX IF NOT EXISTS idx_scheduled_report_executions_estado ON public.scheduled_report_executions(estado);
CREATE INDEX IF NOT EXISTS idx_scheduled_report_executions_tenant_id ON public.scheduled_report_executions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_report_templates_tenant_id ON public.report_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_tipo_reporte ON public.report_templates(tipo_reporte);
CREATE INDEX IF NOT EXISTS idx_report_templates_created_by ON public.report_templates(created_by);

-- Insert sample report templates
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
        -- Insert sample report templates
        INSERT INTO public.report_templates (nombre, tipo_reporte, configuracion, tenant_id, created_by)
        VALUES 
            ('Reporte de Ventas Diario', 'sales', '{"filters": {"status": "pagado"}, "columns": ["fecha", "cliente", "evento", "monto", "estado"]}', sample_tenant_id, sample_user_id),
            ('Reporte de Eventos Semanal', 'events', '{"filters": {"activo": true}, "columns": ["nombre", "fecha_evento", "funciones", "estado"]}', sample_tenant_id, sample_user_id),
            ('Reporte de Usuarios Mensual', 'users', '{"filters": {}, "columns": ["login", "email", "empresa", "fecha_registro"]}', sample_tenant_id, sample_user_id),
            ('Reporte de Pagos Diario', 'payments', '{"filters": {"status": "pagado"}, "columns": ["id", "cliente", "monto", "estado", "fecha"]}', sample_tenant_id, sample_user_id)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sample report templates inserted for tenant: %', sample_tenant_id;
    ELSE
        RAISE NOTICE 'No tenants or users found, skipping sample data insertion';
    END IF;
END $$;

-- Add comments to tables
COMMENT ON TABLE public.scheduled_reports IS 'Scheduled email reports configuration';
COMMENT ON TABLE public.scheduled_report_executions IS 'Execution history of scheduled reports';
COMMENT ON TABLE public.report_templates IS 'Predefined report templates';
