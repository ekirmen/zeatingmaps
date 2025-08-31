-- Script de debug para el problema "No hay eventos disponibles" en EventThemePanel
-- Ejecutar este script para diagnosticar el problema

-- 1. Verificar que la tabla event_theme_settings existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'event_theme_settings';

-- 2. Verificar la estructura de la tabla eventos
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'eventos' 
ORDER BY ordinal_position;

-- 3. Verificar la estructura de la tabla tenants
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- 4. Verificar si hay eventos en la base de datos
SELECT 
  COUNT(*) as total_eventos,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as eventos_con_tenant,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as eventos_sin_tenant
FROM eventos;

-- 5. Verificar si hay tenants
SELECT 
  COUNT(*) as total_tenants
FROM tenants;

-- 6. Verificar eventos con información de tenant (usando la columna correcta)
SELECT 
  e.id,
  e.nombre,
  e.tenant_id,
  t.nombre as tenant_nombre, -- Columna correcta: t.nombre
  e.fecha_evento,
  e.activo,
  e.oculto
FROM eventos e
LEFT JOIN tenants t ON e.tenant_id = t.id
ORDER BY e.created_at DESC
LIMIT 10;

-- 7. Verificar políticas RLS en la tabla eventos
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'eventos';

-- 8. Verificar si el usuario actual tiene acceso a eventos
-- (Ejecutar esto como el usuario autenticado)
SELECT 
  current_user,
  session_user,
  current_setting('request.jwt.claims', true) as jwt_claims;

-- 9. Verificar eventos activos y visibles
SELECT 
  COUNT(*) as eventos_activos_visibles
FROM eventos 
WHERE activo = true AND oculto = false;

-- 10. Verificar eventos por tenant específico (reemplazar UUID_TENANT con el ID real)
-- SELECT 
--   id,
--   nombre,
--   fecha_evento,
--   activo,
--   oculto
-- FROM eventos 
-- WHERE tenant_id = 'UUID_TENANT'
-- ORDER BY created_at DESC;

-- 11. Verificar si hay configuraciones de tema existentes
SELECT 
  COUNT(*) as total_temas_evento
FROM event_theme_settings;

-- 12. Verificar configuraciones de tema por tenant (usando la columna correcta)
SELECT 
  ets.tenant_id,
  t.nombre as tenant_nombre, -- Columna correcta: t.nombre
  COUNT(*) as temas_configurados
FROM event_theme_settings ets
LEFT JOIN tenants t ON ets.tenant_id = t.id
GROUP BY ets.tenant_id, t.nombre;

-- 13. Verificar permisos del usuario en las tablas
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_name IN ('eventos', 'event_theme_settings', 'tenants')
ORDER BY table_name, grantee;

-- 14. Verificar datos de ejemplo en tenants
SELECT 
  id,
  nombre, -- Columna correcta: nombre
  created_at
FROM tenants
LIMIT 5;
