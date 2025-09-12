-- =====================================================
-- SCRIPT PARA LIMPIAR TABLA PROFILES
-- Elimina campos redundantes y obsoletos
-- =====================================================

-- PASO 1: BACKUP DE SEGURIDAD
CREATE TABLE IF NOT EXISTS profiles_backup_20241212 AS 
SELECT * FROM profiles;

-- PASO 2: VERIFICAR DATOS EN CAMPOS OBSOLETOS
SELECT 
  'empresa' as campo,
  COUNT(*) as registros_con_datos,
  COUNT(DISTINCT empresa) as valores_unicos
FROM profiles 
WHERE empresa IS NOT NULL AND empresa != ''

UNION ALL

SELECT 
  'perfil' as campo,
  COUNT(*) as registros_con_datos,
  COUNT(DISTINCT perfil) as valores_unicos
FROM profiles 
WHERE perfil IS NOT NULL AND perfil != '{}'

UNION ALL

SELECT 
  'formadepago' as campo,
  COUNT(*) as registros_con_datos,
  COUNT(DISTINCT formadepago) as valores_unicos
FROM profiles 
WHERE formadepago IS NOT NULL AND formadepago != '';

-- PASO 3: VERIFICAR DUPLICADOS
SELECT 
  'activo vs is_active' as comparacion,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN activo = is_active THEN 1 END) as coincidencias,
  COUNT(CASE WHEN activo != is_active THEN 1 END) as diferencias
FROM profiles 
WHERE activo IS NOT NULL AND is_active IS NOT NULL

UNION ALL

SELECT 
  'permisos vs permissions' as comparacion,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN permisos = permissions THEN 1 END) as coincidencias,
  COUNT(CASE WHEN permisos != permissions THEN 1 END) as diferencias
FROM profiles 
WHERE permisos IS NOT NULL AND permissions IS NOT NULL;

-- PASO 4: MIGRAR DATOS IMPORTANTES (si es necesario)
-- Nota: Revisar los resultados del PASO 3 antes de proceder

-- Si hay diferencias entre activo e is_active, mantener 'activo'
UPDATE profiles 
SET activo = is_active 
WHERE activo IS NULL AND is_active IS NOT NULL;

-- Si hay diferencias entre permisos y permissions, mantener 'permisos'
UPDATE profiles 
SET permisos = permissions 
WHERE permisos IS NULL AND permissions IS NOT NULL;

-- PASO 5: ELIMINAR CAMPOS REDUNDANTES
-- Eliminar duplicados (mantener solo uno de cada par)

-- Eliminar is_active (mantener activo)
ALTER TABLE profiles DROP COLUMN IF EXISTS is_active;

-- Eliminar permissions (mantener permisos)
ALTER TABLE profiles DROP COLUMN IF EXISTS permissions;

-- Eliminar full_name (mantener nombre)
ALTER TABLE profiles DROP COLUMN IF EXISTS full_name;

-- PASO 6: ELIMINAR CAMPOS OBSOLETOS
-- Eliminar campos que han sido reemplazados por otros

-- Eliminar empresa (usar tenant_id)
ALTER TABLE profiles DROP COLUMN IF EXISTS empresa;

-- Eliminar perfil (usar role + permisos)
ALTER TABLE profiles DROP COLUMN IF EXISTS perfil;

-- Eliminar formadepago (usar metodospago)
ALTER TABLE profiles DROP COLUMN IF EXISTS formadepago;

-- PASO 7: ELIMINAR ÍNDICES OBSOLETOS
-- Eliminar índices de campos eliminados

DROP INDEX IF EXISTS idx_profiles_is_active;
DROP INDEX IF EXISTS idx_profiles_permisos; -- Si se eliminó permissions

-- PASO 8: VERIFICAR ESTRUCTURA FINAL
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASO 9: VERIFICAR INTEGRIDAD
-- Verificar que no se perdió información crítica
SELECT 
  COUNT(*) as total_registros,
  COUNT(activo) as registros_con_activo,
  COUNT(permisos) as registros_con_permisos,
  COUNT(nombre) as registros_con_nombre,
  COUNT(tenant_id) as registros_con_tenant_id
FROM profiles;

-- PASO 10: ESTADÍSTICAS FINALES
SELECT 
  'CAMPOS ELIMINADOS' as accion,
  'is_active, permissions, full_name, empresa, perfil, formadepago' as campos,
  '6 campos redundantes/obsoletos eliminados' as resultado

UNION ALL

SELECT 
  'CAMPOS MANTENIDOS' as accion,
  'id, login, nombre, apellido, telefono, email, tenant_id, role, activo, permisos, canales, metodospago, recintos, tags, created_at, updated_at' as campos,
  '16 campos esenciales mantenidos' as resultado;

-- =====================================================
-- RESUMEN DE CAMBIOS:
-- =====================================================
-- ✅ ELIMINADOS (6 campos):
--   - is_active (duplicado de activo)
--   - permissions (duplicado de permisos)  
--   - full_name (duplicado de nombre)
--   - empresa (obsoleto, usar tenant_id)
--   - perfil (obsoleto, usar role + permisos)
--   - formadepago (obsoleto, usar metodospago)
--
-- ✅ MANTENIDOS (16 campos):
--   - id, login, nombre, apellido, telefono, email
--   - tenant_id, role, activo, permisos
--   - canales, metodospago, recintos, tags
--   - created_at, updated_at
--
-- ✅ BENEFICIOS:
--   - Reducción de redundancia
--   - Mejor rendimiento
--   - Código más limpio
--   - Mantenimiento simplificado
-- =====================================================
