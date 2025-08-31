-- Script de debug basado en la estructura real de las tablas
-- La tabla eventos NO tiene tenant_id, lo que explica el problema

-- 1. Verificar que las tablas principales existen
SELECT 
  'Verificación de Tablas' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'eventos') 
    THEN '✅ Tabla eventos existe' 
    ELSE '❌ Tabla eventos NO existe' 
  END as eventos_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_theme_settings') 
    THEN '✅ Tabla event_theme_settings existe' 
    ELSE '❌ Tabla event_theme_settings NO existe' 
  END as theme_settings_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') 
    THEN '✅ Tabla tenants existe' 
    ELSE '❌ Tabla tenants NO existe' 
  END as tenants_status;

-- 2. Verificar que hay datos en las tablas
SELECT 
  'Verificación de Datos' as test,
  (SELECT COUNT(*) FROM eventos) as total_eventos,
  (SELECT COUNT(*) FROM event_theme_settings) as total_temas,
  (SELECT COUNT(*) FROM tenants) as total_tenants;

-- 3. Verificar eventos activos y visibles (sin tenant_id)
SELECT 
  'Eventos Activos y Visibles' as test,
  COUNT(*) as total_eventos,
  COUNT(CASE WHEN activo = true THEN 1 END) as eventos_activos,
  COUNT(CASE WHEN desactivado = false THEN 1 END) as eventos_no_desactivados
FROM eventos;

-- 4. Verificar políticas RLS en event_theme_settings (si la tabla existe)
SELECT 
  'Políticas RLS en event_theme_settings' as test,
  policyname,
  permissive,
  cmd,
  CASE 
    WHEN qual LIKE '%tenant_id%' THEN '✅ Política de tenant configurada'
    ELSE '⚠️ Política de tenant NO configurada'
  END as tenant_policy_status
FROM pg_policies 
WHERE tablename = 'event_theme_settings';

-- 5. Verificar que la función get_or_create_event_theme_settings existe
SELECT 
  'Verificación de Funciones' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_or_create_event_theme_settings') 
    THEN '✅ Función get_or_create_event_theme_settings existe' 
    ELSE '❌ Función get_or_create_event_theme_settings NO existe' 
  END as function_status;

-- 6. Mostrar eventos disponibles (estructura real)
SELECT 
  'Eventos Disponibles' as info,
  id,
  nombre,
  fecha_evento,
  recinto,
  activo,
  desactivado,
  created_at
FROM eventos
ORDER BY created_at DESC
LIMIT 10;

-- 7. Mostrar tenants disponibles
SELECT 
  'Tenants Disponibles' as info,
  *
FROM tenants
ORDER BY created_at DESC
LIMIT 5;

-- 8. Verificar si hay eventos con recinto configurado
SELECT 
  'Verificación de Recintos' as test,
  COUNT(*) as total_eventos,
  COUNT(CASE WHEN recinto IS NOT NULL THEN 1 END) as eventos_con_recinto,
  COUNT(CASE WHEN recinto IS NULL THEN 1 END) as eventos_sin_recinto
FROM eventos;

-- 9. Resumen del problema identificado
SELECT 
  'PROBLEMA IDENTIFICADO' as test,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eventos' AND column_name = 'tenant_id') 
    THEN '❌ La tabla eventos NO tiene columna tenant_id'
    ELSE '✅ La tabla eventos SÍ tiene columna tenant_id'
  END as tenant_id_status,
  CASE 
    WHEN (SELECT COUNT(*) FROM eventos) > 0 THEN '✅ Hay eventos disponibles'
    ELSE '❌ NO hay eventos disponibles'
  END as eventos_status,
  CASE 
    WHEN (SELECT COUNT(*) FROM event_theme_settings) > 0 THEN '✅ Hay temas configurados'
    ELSE '⚠️ NO hay temas configurados'
  END as temas_status;

-- 10. Verificar si hay columna oculto en eventos
SELECT 
  'Verificación de Columna oculto' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eventos' AND column_name = 'oculto') 
    THEN '✅ Columna oculto existe'
    ELSE '❌ Columna oculto NO existe'
  END as oculto_status;
