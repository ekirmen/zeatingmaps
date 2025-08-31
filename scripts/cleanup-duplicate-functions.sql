-- Script para limpiar funciones duplicadas y conflictos
-- Ejecutar antes de crear las nuevas funciones

-- 1. Ver qué funciones existen actualmente
SELECT 
  'Funciones existentes' as info,
  proname as function_name,
  proargtypes::regtype[] as argument_types
FROM pg_proc 
WHERE proname IN (
  'update_event_theme_settings_updated_at',
  'get_or_create_event_theme_settings',
  'get_available_events_with_fallback'
)
ORDER BY proname;

-- 2. Eliminar funciones duplicadas si existen
DROP FUNCTION IF EXISTS public.update_event_theme_settings_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_event_theme_settings(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_available_events_with_fallback(UUID) CASCADE;

-- 3. Verificar que se eliminaron
SELECT 
  'Funciones después de limpiar' as info,
  proname as function_name,
  proargtypes::regtype[] as argument_types
FROM pg_proc 
WHERE proname IN (
  'update_event_theme_settings_updated_at',
  'get_or_create_event_theme_settings',
  'get_available_events_with_fallback'
)
ORDER BY proname;

-- 4. Verificar que no hay conflictos
SELECT 
  'Estado de limpieza' as status,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Funciones duplicadas eliminadas'
    ELSE '⚠️ Aún existen ' || COUNT(*) || ' funciones'
  END as message
FROM pg_proc 
WHERE proname IN (
  'update_event_theme_settings_updated_at',
  'get_or_create_event_theme_settings',
  'get_available_events_with_fallback'
);
