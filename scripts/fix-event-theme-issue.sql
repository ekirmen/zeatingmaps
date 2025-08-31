-- Script para arreglar el problema "No hay eventos disponibles" en EventThemePanel
-- Este script crea datos de ejemplo y asegura que la funcionalidad funcione

-- 1. Asegurar que la tabla event_theme_settings existe
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

-- 2. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_event_theme_settings_event_id ON public.event_theme_settings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_theme_settings_tenant_id ON public.event_theme_settings(tenant_id);

-- 3. Habilitar RLS
ALTER TABLE public.event_theme_settings ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS si no existen
DO $$
BEGIN
  -- Política para SELECT
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_theme_settings' AND policyname = 'Users can view own tenant event theme settings') THEN
    CREATE POLICY "Users can view own tenant event theme settings" ON public.event_theme_settings
      FOR SELECT USING (tenant_id::text = auth.jwt() ->> 'tenant_id');
  END IF;
  
  -- Política para INSERT
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_theme_settings' AND policyname = 'Users can insert own tenant event theme settings') THEN
    CREATE POLICY "Users can insert own tenant event theme settings" ON public.event_theme_settings
      FOR INSERT WITH CHECK (tenant_id::text = auth.jwt() ->> 'tenant_id');
  END IF;
  
  -- Política para UPDATE
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_theme_settings' AND policyname = 'Users can update own tenant event theme settings') THEN
    CREATE POLICY "Users can update own tenant event theme settings" ON public.event_theme_settings
      FOR UPDATE USING (tenant_id::text = auth.jwt() ->> 'tenant_id');
  END IF;
  
  -- Política para DELETE
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_theme_settings' AND policyname = 'Users can delete own tenant event theme settings') THEN
    CREATE POLICY "Users can delete own tenant event theme settings" ON public.event_theme_settings
      FOR DELETE USING (tenant_id::text = auth.jwt() ->> 'tenant_id');
  END IF;
END $$;

-- 5. Crear trigger para updated_at si no existe
CREATE OR REPLACE FUNCTION update_event_theme_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_theme_settings_updated_at ON public.event_theme_settings;
CREATE TRIGGER trigger_update_event_theme_settings_updated_at
  BEFORE UPDATE ON public.event_theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_event_theme_settings_updated_at();

-- 6. Crear función para obtener o crear configuración de tema por evento
CREATE OR REPLACE FUNCTION get_or_create_event_theme_settings(
  p_event_id UUID,
  p_tenant_id UUID,
  p_event_name VARCHAR(255) DEFAULT NULL
)
RETURNS public.event_theme_settings AS $$
DECLARE
  v_theme_setting public.event_theme_settings;
BEGIN
  -- Intentar obtener configuración existente
  SELECT * INTO v_theme_setting 
  FROM public.event_theme_settings 
  WHERE event_id = p_event_id AND tenant_id = p_tenant_id;
  
  -- Si no existe, crear una nueva
  IF v_theme_setting IS NULL THEN
    INSERT INTO public.event_theme_settings (
      event_id, 
      tenant_id, 
      event_name,
      seat_available,
      seat_selected_me,
      seat_selected_other,
      seat_blocked,
      seat_sold,
      seat_reserved
    ) VALUES (
      p_event_id,
      p_tenant_id,
      COALESCE(p_event_name, 'Evento ' || p_event_id::text),
      '#4CAF50',
      '#1890ff',
      '#faad14',
      '#ff4d4f',
      '#8c8c8c',
      '#722ed1'
    )
    RETURNING * INTO v_theme_setting;
  END IF;
  
  RETURN v_theme_setting;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Verificar que hay eventos disponibles (crear uno de ejemplo si no hay)
DO $$
DECLARE
  event_count INTEGER;
  tenant_id UUID;
  event_id UUID;
BEGIN
  -- Contar eventos existentes
  SELECT COUNT(*) INTO event_count FROM eventos;
  
  -- Obtener el primer tenant disponible
  SELECT id INTO tenant_id FROM tenants LIMIT 1;
  
  -- Si no hay eventos, crear uno de ejemplo
  IF event_count = 0 AND tenant_id IS NOT NULL THEN
    INSERT INTO eventos (
      nombre,
      fecha_evento,
      tenant_id,
      activo,
      oculto,
      descripcion
    ) VALUES (
      'Evento de Prueba',
      NOW() + INTERVAL '30 days',
      tenant_id,
      true,
      false,
      'Evento de prueba para configurar colores personalizados'
    ) RETURNING id INTO event_id;
    
    RAISE NOTICE 'Evento de prueba creado con ID: %', event_id;
  ELSE
    RAISE NOTICE 'Hay % eventos en la base de datos', event_count;
  END IF;
END $$;

-- 8. Verificar que hay configuraciones de tema de ejemplo
DO $$
DECLARE
  theme_count INTEGER;
  event_id UUID;
  tenant_id UUID;
BEGIN
  -- Contar configuraciones de tema existentes
  SELECT COUNT(*) INTO theme_count FROM event_theme_settings;
  
  -- Si no hay configuraciones, crear una de ejemplo
  IF theme_count = 0 THEN
    -- Obtener el primer evento y tenant disponibles
    SELECT e.id, e.tenant_id INTO event_id, tenant_id 
    FROM eventos e 
    WHERE e.activo = true 
    LIMIT 1;
    
    IF event_id IS NOT NULL AND tenant_id IS NOT NULL THEN
      INSERT INTO event_theme_settings (
        event_id,
        tenant_id,
        event_name,
        seat_available,
        seat_selected_me,
        seat_selected_other,
        seat_blocked,
        seat_sold,
        seat_reserved
      ) VALUES (
        event_id,
        tenant_id,
        'Evento con Tema Personalizado',
        '#00ff00', -- Verde brillante
        '#0000ff', -- Azul
        '#ffff00', -- Amarillo
        '#ff0000', -- Rojo
        '#808080', -- Gris
        '#800080'  -- Púrpura
      );
      
      RAISE NOTICE 'Configuración de tema de ejemplo creada para el evento %', event_id;
    ELSE
      RAISE NOTICE 'No se pudo crear configuración de tema de ejemplo - no hay eventos o tenants disponibles';
    END IF;
  ELSE
    RAISE NOTICE 'Hay % configuraciones de tema en la base de datos', theme_count;
  END IF;
END $$;

-- 9. Comentarios finales
COMMENT ON TABLE public.event_theme_settings IS 'Configuraciones de colores específicas por evento';
COMMENT ON COLUMN public.event_theme_settings.seat_available IS 'Color para asientos disponibles';
COMMENT ON COLUMN public.event_theme_settings.seat_selected_me IS 'Color para asientos seleccionados por el usuario actual';
COMMENT ON COLUMN public.event_theme_settings.seat_selected_other IS 'Color para asientos seleccionados por otros usuarios';
COMMENT ON COLUMN public.event_theme_settings.seat_blocked IS 'Color para asientos bloqueados';
COMMENT ON COLUMN public.event_theme_settings.seat_sold IS 'Color para asientos vendidos';
COMMENT ON COLUMN public.event_theme_settings.seat_reserved IS 'Color para asientos reservados';

-- 10. Verificar el estado final
SELECT 
  'Estado Final' as status,
  (SELECT COUNT(*) FROM eventos) as total_eventos,
  (SELECT COUNT(*) FROM event_theme_settings) as total_temas,
  (SELECT COUNT(*) FROM tenants) as total_tenants;

-- 11. Mostrar información de los tenants disponibles
SELECT 
  'Tenants Disponibles' as info,
  id,
  nombre, -- Columna correcta: nombre
  created_at
FROM tenants
ORDER BY created_at DESC;
