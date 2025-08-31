-- Script para completar la configuración del sistema de temas por evento
-- Ejecutar después de que la tabla event_theme_settings ya esté creada

-- 1. Crear la función que falta para el trigger
CREATE OR REPLACE FUNCTION public.update_event_theme_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Habilitar RLS en la tabla
ALTER TABLE public.event_theme_settings ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes si existen (para evitar conflictos)
DROP POLICY IF EXISTS "Users can view event theme settings for their tenant" ON public.event_theme_settings;
DROP POLICY IF EXISTS "Users can insert event theme settings for their tenant" ON public.event_theme_settings;
DROP POLICY IF EXISTS "Users can update event theme settings for their tenant" ON public.event_theme_settings;
DROP POLICY IF EXISTS "Users can delete event theme settings for their tenant" ON public.event_theme_settings;

-- 4. Crear políticas RLS
CREATE POLICY "Users can view event theme settings for their tenant" ON public.event_theme_settings
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert event theme settings for their tenant" ON public.event_theme_settings
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update event theme settings for their tenant" ON public.event_theme_settings
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete event theme settings for their tenant" ON public.event_theme_settings
  FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 5. Crear función para obtener o crear configuración de tema para un evento
CREATE OR REPLACE FUNCTION public.get_or_create_event_theme_settings(
  event_id_param UUID,
  tenant_id_param UUID
)
RETURNS public.event_theme_settings AS $$
DECLARE
  existing_settings public.event_theme_settings;
BEGIN
  -- Buscar configuración existente
  SELECT * INTO existing_settings
  FROM public.event_theme_settings
  WHERE event_id = event_id_param AND tenant_id = tenant_id_param;
  
  -- Si no existe, crear una nueva con valores por defecto
  IF existing_settings IS NULL THEN
    INSERT INTO public.event_theme_settings (event_id, tenant_id)
    VALUES (event_id_param, tenant_id_param)
    RETURNING * INTO existing_settings;
  END IF;
  
  RETURN existing_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear función RPC para obtener eventos con fallback de fecha
CREATE OR REPLACE FUNCTION public.get_available_events_with_fallback(tenant_id_param UUID)
RETURNS TABLE(
  id UUID,
  nombre VARCHAR(255),
  fecha_evento TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  display_date TIMESTAMP WITHOUT TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.nombre,
    e.fecha_evento,
    e.created_at,
    COALESCE(e.fecha_evento, e.created_at) as display_date
  FROM public.eventos e
  WHERE e.tenant_id = tenant_id_param
  ORDER BY COALESCE(e.fecha_evento, e.created_at) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Agregar comentarios para documentar
COMMENT ON TABLE public.event_theme_settings IS 'Configuraciones de colores personalizados por evento y tenant';
COMMENT ON FUNCTION public.update_event_theme_settings_updated_at IS 'Función para actualizar automáticamente updated_at en event_theme_settings';
COMMENT ON FUNCTION public.get_or_create_event_theme_settings IS 'Obtiene o crea configuración de tema para un evento';
COMMENT ON FUNCTION public.get_available_events_with_fallback IS 'Obtiene eventos ordenados por fecha_evento o created_at como fallback';

-- 8. Verificar que todo esté funcionando
SELECT 
  'Tabla event_theme_settings' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_theme_settings') 
       THEN '✅ Creada' ELSE '❌ No existe' END as status
UNION ALL
SELECT 
  'RLS habilitado' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_theme_settings' AND row_security = 'YES') 
       THEN '✅ Habilitado' ELSE '❌ No habilitado' END as status
UNION ALL
SELECT 
  'Políticas RLS' as item,
  CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_theme_settings') 
       THEN '✅ Configuradas' ELSE '❌ No configuradas' END as status
UNION ALL
SELECT 
  'Función update_event_theme_settings_updated_at' as item,
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_event_theme_settings_updated_at') 
       THEN '✅ Creada' ELSE '❌ No existe' END as status
UNION ALL
SELECT 
  'Función get_available_events_with_fallback' as item,
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_available_events_with_fallback') 
       THEN '✅ Creada' ELSE '❌ No existe' END as status;
