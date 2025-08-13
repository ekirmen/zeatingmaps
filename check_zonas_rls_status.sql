-- Script para verificar el estado actual de RLS en la tabla zonas
-- No modifica nada, solo muestra información

-- 1. Verificar si RLS está habilitado
SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS habilitado'
    ELSE '❌ RLS deshabilitado'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'zonas' 
AND schemaname = 'public';

-- 2. Verificar políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  CASE 
    WHEN cmd = 'ALL' THEN '🔄 Todas las operaciones'
    WHEN cmd = 'SELECT' THEN '👁️ Solo lectura'
    WHEN cmd = 'INSERT' THEN '➕ Solo inserción'
    WHEN cmd = 'UPDATE' THEN '✏️ Solo actualización'
    WHEN cmd = 'DELETE' THEN '🗑️ Solo eliminación'
    ELSE '❓ Operación desconocida'
  END as operacion_descripcion
FROM pg_policies 
WHERE tablename = 'zonas'
ORDER BY policyname;

-- 3. Verificar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN is_nullable = 'NO' THEN 'NOT NULL'
    ELSE 'nullable'
  END as nullability,
  CASE 
    WHEN column_name = 'tenant_id' THEN '🔑 Clave foránea a tenants'
    WHEN column_name = 'sala_id' THEN '🏢 Clave foránea a salas'
    WHEN column_name = 'id' THEN '🆔 Clave primaria'
    ELSE '📝 Campo normal'
  END as descripcion
FROM information_schema.columns 
WHERE table_name = 'zonas' 
AND table_schema = 'public'
AND column_name IN ('id', 'nombre', 'color', 'aforo', 'numerada', 'sala_id', 'tenant_id', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- 4. Verificar índices existentes
SELECT 
  indexname,
  indexdef,
  CASE 
    WHEN indexname LIKE '%tenant_id%' THEN '🔑 Índice en tenant_id'
    WHEN indexname LIKE '%sala_id%' THEN '🏢 Índice en sala_id'
    ELSE '📊 Otro índice'
  END as descripcion
FROM pg_indexes 
WHERE tablename = 'zonas' 
AND schemaname = 'public';

-- 5. Verificar si hay zonas sin tenant_id
SELECT 
  COUNT(*) as total_zonas,
  COUNT(tenant_id) as zonas_con_tenant,
  COUNT(*) - COUNT(tenant_id) as zonas_sin_tenant,
  CASE 
    WHEN COUNT(tenant_id) = COUNT(*) THEN '✅ Todas las zonas tienen tenant_id'
    WHEN COUNT(tenant_id) > 0 THEN '⚠️ Algunas zonas tienen tenant_id'
    ELSE '❌ Ninguna zona tiene tenant_id'
  END as estado_tenant
FROM zonas;

-- 6. Verificar permisos de la tabla
SELECT 
  grantee,
  privilege_type,
  is_grantable,
  CASE 
    WHEN privilege_type = 'SELECT' THEN '👁️ Lectura'
    WHEN privilege_type = 'INSERT' THEN '➕ Inserción'
    WHEN privilege_type = 'UPDATE' THEN '✏️ Actualización'
    WHEN privilege_type = 'DELETE' THEN '🗑️ Eliminación'
    WHEN privilege_type = 'REFERENCES' THEN '🔗 Referencias'
    ELSE '❓ Otro permiso'
  END as permiso_descripcion
FROM information_schema.role_table_grants 
WHERE table_name = 'zonas' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;
