-- Add email_template_id to scheduled_reports table
-- This migration adds the ability to link scheduled reports to custom email templates

-- Add email_template_id column to scheduled_reports table
ALTER TABLE public.scheduled_reports 
ADD COLUMN IF NOT EXISTS email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL;

-- Add comment to the new column
COMMENT ON COLUMN public.scheduled_reports.email_template_id IS 'Reference to the email template used for this scheduled report';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_email_template_id ON public.scheduled_reports(email_template_id);

-- Update existing scheduled reports to use default templates if they exist
DO $$
DECLARE
    sample_tenant_id UUID;
    default_template_id UUID;
BEGIN
    -- Get the first tenant ID
    SELECT id INTO sample_tenant_id FROM tenants LIMIT 1;
    
    IF sample_tenant_id IS NOT NULL THEN
        -- For each report type, try to find a default template
        FOR default_template_id IN 
            SELECT et.id 
            FROM email_templates et 
            WHERE et.tenant_id = sample_tenant_id 
            AND et.es_predeterminado = true
        LOOP
            -- Update scheduled reports of the same type to use this template
            UPDATE scheduled_reports 
            SET email_template_id = default_template_id
            WHERE tenant_id = sample_tenant_id 
            AND tipo_reporte = (
                SELECT tipo_reporte 
                FROM email_templates 
                WHERE id = default_template_id
            )
            AND email_template_id IS NULL;
        END LOOP;
        
        RAISE NOTICE 'Updated existing scheduled reports with default email templates';
    ELSE
        RAISE NOTICE 'No tenants found, skipping default template assignment';
    END IF;
END $$;
