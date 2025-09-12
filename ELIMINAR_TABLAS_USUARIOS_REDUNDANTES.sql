-- =====================================================
-- SCRIPT CONSOLIDADO PARA ELIMINAR TABLAS DE USUARIOS REDUNDANTES
-- Elimina usuarios y users (ambas redundantes con profiles)
-- =====================================================

-- PASO 1: BACKUP DE SEGURIDAD
CREATE TABLE IF NOT EXISTS usuarios_backup AS SELECT * FROM usuarios;
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- PASO 2: VERIFICAR DATOS EN TABLAS REDUNDANTES
SELECT 
  'usuarios' as tabla,
  COUNT(*) as total_registros,
  COUNT(DISTINCT email) as emails_unicos,
  COUNT(DISTINCT tenant_id) as tenants_unicos
FROM usuarios

UNION ALL

SELECT 
  'users' as tabla,
  COUNT(*) as total_registros,
  COUNT(DISTINCT email) as emails_unicos,
  COUNT(DISTINCT tenant_id) as tenants_unicos
FROM users

UNION ALL

SELECT 
  'profiles' as tabla,
  COUNT(*) as total_registros,
  COUNT(DISTINCT email) as emails_unicos,
  COUNT(DISTINCT tenant_id) as tenants_unicos
FROM profiles;

-- PASO 3: VERIFICAR REFERENCIAS EXTERNAS
-- Buscar si hay otras tablas que referencien estas tablas
SELECT 
  'Referencias a usuarios' as tabla,
  COUNT(*) as referencias
FROM information_schema.key_column_usage 
WHERE referenced_table_name = 'usuarios' 
  AND table_schema = 'public'

UNION ALL

SELECT 
  'Referencias a users' as tabla,
  COUNT(*) as referencias
FROM information_schema.key_column_usage 
WHERE referenced_table_name = 'users' 
  AND table_schema = 'public';

-- PASO 4: ELIMINAR ÍNDICES
DROP INDEX IF EXISTS idx_usuarios_tenant_id;
DROP INDEX IF EXISTS idx_users_tenant_id;

-- PASO 5: ELIMINAR TABLAS REDUNDANTES
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- PASO 6: VERIFICAR ELIMINACIÓN
SELECT 
  'usuarios eliminada' as resultado,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios' AND table_schema = 'public')
    THEN 'ERROR: Tabla aún existe'
    ELSE 'ÉXITO: Tabla eliminada correctamente'
  END as estado

UNION ALL

SELECT 
  'users eliminada' as resultado,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
    THEN 'ERROR: Tabla aún existe'
    ELSE 'ÉXITO: Tabla eliminada correctamente'
  END as estado;

-- PASO 7: VERIFICAR QUE PROFILES SIGUE FUNCIONANDO
SELECT 
  'profiles funcionando' as verificacion,
  COUNT(*) as total_profiles,
  COUNT(DISTINCT email) as emails_unicos,
  COUNT(DISTINCT tenant_id) as tenants_unicos
FROM profiles;

-- PASO 8: ESTADÍSTICAS FINALES
SELECT 
  'TABLAS ELIMINADAS' as accion,
  'usuarios, users' as tablas,
  '2 tablas redundantes eliminadas' as resultado

UNION ALL

SELECT 
  'TABLA MANTENIDA' as accion,
  'profiles' as tablas,
  'Tabla principal de usuarios' as resultado

UNION ALL

SELECT 
  'BENEFICIOS' as accion,
  'Redundancia eliminada' as tablas,
  'Base de datos simplificada' as resultado;

-- =====================================================
-- RESUMEN DE CAMBIOS:
-- =====================================================
-- ✅ ELIMINADAS (2 tablas):
--   - usuarios (completamente redundante con profiles)
--   - users (completamente redundante con profiles)
--
-- ✅ MANTENIDA (1 tabla):
--   - profiles (tabla principal de usuarios)
--
-- ✅ BENEFICIOS:
--   - Eliminación total de redundancia
--   - Simplificación de la base de datos
--   - Mejor rendimiento (menos tablas)
--   - Código más limpio (una sola fuente de verdad)
--   - Mantenimiento simplificado
--
-- ✅ MIGRACIÓN REQUERIDA:
--   - Cambiar referencias de 'usuarios' a 'profiles'
--   - Cambiar referencias de 'users' a 'profiles'
--   - Actualizar consultas en el código
--   - Verificar funcionalidad
-- =====================================================
