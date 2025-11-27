-- Tabla para guardar configuraciones de reportes por usuario y tenant
CREATE TABLE IF NOT EXISTS public.report_configs (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  selected_report VARCHAR(100) NOT NULL DEFAULT 'sales',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  schedule JSONB,
  date_mode VARCHAR(50) DEFAULT 'fixed',
  language VARCHAR(20) DEFAULT 'es_MX',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT report_configs_pkey PRIMARY KEY (id),
  CONSTRAINT report_configs_tenant_id_fkey FOREIGN KEY (tenant_id)
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT report_configs_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Índices
CREATE INDEX IF NOT EXISTS idx_report_configs_tenant_id
  ON public.report_configs USING btree (tenant_id)
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_report_configs_user_id
  ON public.report_configs USING btree (user_id)
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_report_configs_created_at
  ON public.report_configs USING btree (created_at DESC)
  TABLESPACE pg_default;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_report_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_report_configs_updated_at ON public.report_configs;
CREATE TRIGGER update_report_configs_updated_at
  BEFORE UPDATE ON public.report_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_report_configs_updated_at();

-- Seguridad por filas
ALTER TABLE public.report_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their report configs"
  ON public.report_configs
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert report configs in their tenant"
  ON public.report_configs
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their report configs"
  ON public.report_configs
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their report configs"
  ON public.report_configs
  FOR DELETE
  USING (
    user_id = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.report_configs IS 'Configuraciones guardadas de reportes por usuario y tenant';
COMMENT ON COLUMN public.report_configs.filters IS 'Filtros del reporte guardados como JSON';
COMMENT ON COLUMN public.report_configs.schedule IS 'Configuración de programación opcional';
