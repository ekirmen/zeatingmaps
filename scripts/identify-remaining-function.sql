-- Script para identificar exactamente qué función queda después de la limpieza

-- 1. Ver todas las funciones relacionadas con event_theme_settings
SELECT 
  'Función encontrada' as info,
  proname as function_name,
  proargtypes::regtype[] as argument_types,
  prosrc as function_source
FROM pg_proc 
WHERE proname IN (
  'update_event_theme_settings_updated_at',
  'get_or_create_event_theme_settings',
  'get_available_events_with_fallback'
)
ORDER BY proname;

-- 2. Ver también funciones con nombres similares que podrían estar causando conflictos
SELECT 
  'Funciones similares' as info,
  proname as function_name,
  proargtypes::regtype[] as argument_types
FROM pg_proc 
WHERE proname LIKE '%event_theme%' 
   OR proname LIKE '%update%updated%'
   OR proname LIKE '%get_or_create%'
   OR proname LIKE '%get_available%'
ORDER BY proname;

-- 3. Ver si hay funciones en otros esquemas
SELECT 
  'Funciones en otros esquemas' as info,
  n.nspname as schema_name,
  p.proname as function_name,
  p.proargtypes::regtype[] as argument_types
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN (
  'update_event_theme_settings_updated_at',
  'get_or_create_event_theme_settings',
  'get_available_events_with_fallback'
)
  AND n.nspname != 'public'
ORDER BY n.nspname, p.proname;
