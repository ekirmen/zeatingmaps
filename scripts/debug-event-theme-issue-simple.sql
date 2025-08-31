-- Script de debug simplificado para el problema "No hay eventos disponibles" en EventThemePanel
-- Ejecutar este script para diagnosticar el problema sin JOINs problemáticos

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

-- 3. Verificar que los eventos tienen tenant_id configurado
SELECT 
  'Verificación de tenant_id en eventos' as test,
  COUNT(*) as total_eventos,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as eventos_con_tenant,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as eventos_sin_tenant
FROM eventos;

-- 4. Verificar eventos activos y visibles
SELECT 
  'Eventos Activos y Visibles' as test,
  COUNT(*) as total_eventos,
  COUNT(CASE WHEN activo = true THEN 1 END) as eventos_activos,
  COUNT(CASE WHEN oculto = false THEN 1 END) as eventos_visibles,
  COUNT(CASE WHEN activo = true AND oculto = false THEN 1 END) as eventos_activos_visibles
FROM eventos;

-- 5. Verificar políticas RLS en event_theme_settings (si la tabla existe)
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

-- 6. Verificar que la función get_or_create_event_theme_settings existe
SELECT 
  'Verificación de Funciones' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_or_create_event_theme_settings') 
    THEN '✅ Función get_or_create_event_theme_settings existe' 
    ELSE '❌ Función get_or_create_event_theme_settings NO existe' 
  END as function_status;

-- 7. Verificar trigger para updated_at
SELECT 
  'Verificación de Triggers' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_event_theme_settings_updated_at') 
    THEN '✅ Trigger updated_at existe' 
    ELSE '❌ Trigger updated_at NO existe' 
  END as trigger_status;

-- 8. Verificar índices en event_theme_settings (si la tabla existe)
SELECT 
  'Verificación de Índices' as test,
  indexname,
  CASE 
    WHEN indexname LIKE '%event_id%' THEN '✅ Índice en event_id'
    WHEN indexname LIKE '%tenant_id%' THEN '✅ Índice en tenant_id'
    ELSE '⚠️ Índice no esperado'
  END as index_status
FROM pg_indexes 
WHERE tablename = 'event_theme_settings';

-- 9. Mostrar eventos disponibles (sin JOIN)
SELECT 
  'Eventos Disponibles' as info,
  id,
  nombre,
  tenant_id,
  fecha_evento,
  activo,
  oculto,
  created_at
FROM eventos
ORDER BY created_at DESC
LIMIT 10;

-- 10. Mostrar tenants disponibles (sin JOIN)
SELECT 
  'Tenants Disponibles' as info,
  *
FROM tenants
ORDER BY created_at DESC
LIMIT 5;

-- 11. Resumen final
SELECT 
  'RESUMEN FINAL' as test,
  CASE 
    WHEN (SELECT COUNT(*) FROM eventos) > 0 THEN '✅ Hay eventos disponibles'
    ELSE '❌ NO hay eventos disponibles'
  END as eventos_status,
  CASE 
    WHEN (SELECT COUNT(*) FROM event_theme_settings) > 0 THEN '✅ Hay temas configurados'
    ELSE '⚠️ NO hay temas configurados'
  END as temas_status,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'event_theme_settings') >= 4 THEN '✅ Políticas RLS configuradas'
    ELSE '❌ Políticas RLS incompletas'
  END as rls_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_or_create_event_theme_settings') THEN '✅ Función auxiliar existe'
    ELSE '❌ Función auxiliar NO existe'
  END as function_status;
