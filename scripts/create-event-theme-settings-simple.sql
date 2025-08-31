-- Crear tabla para configuraciones de tema por evento (versión simplificada)
CREATE TABLE IF NOT EXISTS public.event_theme_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Colores específicos del evento
  seat_available VARCHAR(7) DEFAULT '#4CAF50',
  seat_selected_me VARCHAR(7) DEFAULT '#1890ff',
  seat_selected_other VARCHAR(7) DEFAULT '#faad14',
  seat_blocked VARCHAR(7) DEFAULT '#ff4d4f',
  seat_sold VARCHAR(7) DEFAULT '#8c8c8c',
  seat_reserved VARCHAR(7) DEFAULT '#722ed1',
  
  -- Metadatos
  event_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint único para evitar duplicados
  UNIQUE(event_id, tenant_id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_event_theme_settings_event_id ON public.event_theme_settings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_theme_settings_tenant_id ON public.event_theme_settings(tenant_id);

-- Habilitar RLS
ALTER TABLE public.event_theme_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS simplificadas (sin comparaciones complejas)
CREATE POLICY "Enable all operations for authenticated users" ON public.event_theme_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_event_theme_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_theme_settings_updated_at
  BEFORE UPDATE ON public.event_theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_event_theme_settings_updated_at();

-- Comentarios
COMMENT ON TABLE public.event_theme_settings IS 'Configuraciones de colores específicas por evento';
COMMENT ON COLUMN public.event_theme_settings.seat_available IS 'Color para asientos disponibles';
COMMENT ON COLUMN public.event_theme_settings.seat_selected_me IS 'Color para asientos seleccionados por el usuario actual';
COMMENT ON COLUMN public.event_theme_settings.seat_selected_other IS 'Color para asientos seleccionados por otros usuarios';
COMMENT ON COLUMN public.event_theme_settings.seat_blocked IS 'Color para asientos bloqueados';
COMMENT ON COLUMN public.event_theme_settings.seat_sold IS 'Color para asientos vendidos';
COMMENT ON COLUMN public.event_theme_settings.seat_reserved IS 'Color para asientos reservados';
