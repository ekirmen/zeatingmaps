-- Script de migración para agregar tenant_id a la tabla eventos
-- Este script resuelve el problema "No hay eventos disponibles" en EventThemePanel

-- 1. Verificar el estado actual
SELECT 
  'Estado Actual' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eventos' AND column_name = 'tenant_id') 
    THEN '✅ Columna tenant_id ya existe'
    ELSE '❌ Columna tenant_id NO existe - necesita ser agregada'
  END as tenant_id_status;

-- 2. Agregar la columna tenant_id si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eventos' AND column_name = 'tenant_id') THEN
    -- Agregar la columna tenant_id
    ALTER TABLE eventos ADD COLUMN tenant_id UUID;
    
    -- Crear índice para mejor rendimiento
    CREATE INDEX IF NOT EXISTS idx_eventos_tenant_id ON eventos(tenant_id);
    
    -- Agregar foreign key constraint
    ALTER TABLE eventos ADD CONSTRAINT fk_eventos_tenant_id 
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Columna tenant_id agregada a la tabla eventos';
  ELSE
    RAISE NOTICE 'ℹ️ Columna tenant_id ya existe en la tabla eventos';
  END IF;
END $$;

-- 3. Actualizar eventos existentes con tenant_id (usar el primer tenant disponible)
DO $$
DECLARE
  first_tenant_id UUID;
  updated_count INTEGER;
BEGIN
  -- Obtener el primer tenant disponible
  SELECT id INTO first_tenant_id FROM tenants LIMIT 1;
  
  IF first_tenant_id IS NOT NULL THEN
    -- Actualizar eventos existentes que no tengan tenant_id
    UPDATE eventos 
    SET tenant_id = first_tenant_id 
    WHERE tenant_id IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ % eventos actualizados con tenant_id: %', updated_count, first_tenant_id;
  ELSE
    RAISE NOTICE '⚠️ No hay tenants disponibles para asignar';
  END IF;
END $$;

-- 4. Verificar que la columna se agregó correctamente
SELECT 
  'Verificación Post-Migración' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eventos' AND column_name = 'tenant_id') 
    THEN '✅ Columna tenant_id agregada correctamente'
    ELSE '❌ Error: Columna tenant_id NO se agregó'
  END as tenant_id_status,
  (SELECT COUNT(*) FROM eventos WHERE tenant_id IS NOT NULL) as eventos_con_tenant,
  (SELECT COUNT(*) FROM eventos WHERE tenant_id IS NULL) as eventos_sin_tenant;

-- 5. Verificar que la tabla event_theme_settings existe, si no, crearla
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

-- 6. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_event_theme_settings_event_id ON public.event_theme_settings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_theme_settings_tenant_id ON public.event_theme_settings(tenant_id);

-- 7. Habilitar RLS
ALTER TABLE public.event_theme_settings ENABLE ROW LEVEL SECURITY;

-- 8. Crear políticas RLS
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

-- 9. Crear función auxiliar
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

-- 10. Verificar el estado final
SELECT 
  'ESTADO FINAL' as info,
  (SELECT COUNT(*) FROM eventos) as total_eventos,
  (SELECT COUNT(*) FROM eventos WHERE tenant_id IS NOT NULL) as eventos_con_tenant,
  (SELECT COUNT(*) FROM event_theme_settings) as total_temas,
  (SELECT COUNT(*) FROM tenants) as total_tenants;
