-- Script para eliminar específicamente la función conflictiva
-- La función existente tiene 3 parámetros: [uuid, uuid, "character varying"]

-- 1. Eliminar la función existente con 3 parámetros
DROP FUNCTION IF EXISTS public.get_or_create_event_theme_settings(UUID, UUID, VARCHAR) CASCADE;

-- 2. Verificar que se eliminó
SELECT 
  'Verificación después de eliminar' as info,
  proname as function_name,
  proargtypes::regtype[] as argument_types
FROM pg_proc 
WHERE proname = 'get_or_create_event_theme_settings'
ORDER BY proname;

-- 3. Confirmar que no hay conflictos
SELECT 
  'Estado final' as status,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Función conflictiva eliminada - Listo para crear nueva'
    ELSE '⚠️ Aún existe función: ' || COUNT(*) || ' instancias'
  END as message
FROM pg_proc 
WHERE proname = 'get_or_create_event_theme_settings';
