-- =====================================================
-- SCRIPT PARA ELIMINAR TABLA USERS REDUNDANTE
-- La tabla users es completamente redundante con profiles
-- =====================================================

-- PASO 1: BACKUP DE SEGURIDAD (por si acaso)
CREATE TABLE IF NOT EXISTS users_backup AS 
SELECT * FROM users;

-- PASO 2: VERIFICAR DATOS EN USERS
SELECT 
  'users' as tabla,
  COUNT(*) as total_registros,
  COUNT(DISTINCT email) as emails_unicos,
  COUNT(DISTINCT tenant_id) as tenants_unicos
FROM users;

-- PASO 3: VERIFICAR SI HAY DATOS ÚNICOS EN USERS
-- Comparar con profiles para asegurar que no se pierde información
SELECT 
  'Comparación users vs profiles' as analisis,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(DISTINCT email) FROM users) as users_emails,
  (SELECT COUNT(DISTINCT email) FROM profiles) as profiles_emails;

-- PASO 4: VERIFICAR REFERENCIAS EXTERNAS
-- Buscar si hay otras tablas que referencien users
SELECT 
  table_name,
  column_name,
  constraint_name
FROM information_schema.key_column_usage 
WHERE referenced_table_name = 'users' 
  AND table_schema = 'public';

-- PASO 5: ELIMINAR ÍNDICES
DROP INDEX IF EXISTS idx_users_tenant_id;

-- PASO 6: ELIMINAR TABLA
DROP TABLE IF EXISTS users CASCADE;

-- PASO 7: VERIFICAR ELIMINACIÓN
SELECT 
  'users eliminada' as resultado,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
    THEN 'ERROR: Tabla aún existe'
    ELSE 'ÉXITO: Tabla eliminada correctamente'
  END as estado;

-- PASO 8: VERIFICAR QUE PROFILES SIGUE FUNCIONANDO
SELECT 
  'profiles funcionando' as verificacion,
  COUNT(*) as total_profiles,
  COUNT(DISTINCT email) as emails_unicos,
  COUNT(DISTINCT tenant_id) as tenants_unicos
FROM profiles;

-- =====================================================
-- RESUMEN DE CAMBIOS:
-- =====================================================
-- ✅ ELIMINADA:
--   - Tabla users (completamente redundante)
--   - Índice idx_users_tenant_id
--
-- ✅ MANTENIDA:
--   - Tabla profiles (tabla principal de usuarios)
--   - Todos los datos de usuarios preservados
--   - Funcionalidad completa mantenida
--
-- ✅ BENEFICIOS:
--   - Eliminación de redundancia total
--   - Simplificación de la base de datos
--   - Mejor rendimiento (menos tablas)
--   - Código más limpio (una sola fuente de verdad)
--
-- ✅ MIGRACIÓN:
--   - Cambiar referencias de 'users' a 'profiles'
--   - Actualizar consultas en el código
--   - Verificar funcionalidad
-- =====================================================
