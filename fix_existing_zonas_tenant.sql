-- Script para actualizar zonas existentes que no tienen tenant_id
-- Este script asigna tenant_id a zonas existentes basándose en su sala_id

-- 1. Verificar zonas sin tenant_id
SELECT 
  COUNT(*) as total_zonas,
  COUNT(tenant_id) as zonas_con_tenant,
  COUNT(*) - COUNT(tenant_id) as zonas_sin_tenant
FROM zonas;

-- 2. Mostrar zonas que no tienen tenant_id
SELECT 
  z.id,
  z.nombre,
  z.sala_id,
  s.nombre as nombre_sala,
  r.nombre as nombre_recinto,
  r.tenant_id as tenant_del_recinto
FROM zonas z
LEFT JOIN salas s ON z.sala_id::text = s.id::text
LEFT JOIN recintos r ON s.recinto_id::text = r.id::text
WHERE z.tenant_id IS NULL
ORDER BY z.id;

-- 3. Actualizar zonas existentes con tenant_id
UPDATE zonas 
SET tenant_id = (
  SELECT r.tenant_id 
  FROM salas s 
  JOIN recintos r ON s.recinto_id = r.id 
  WHERE s.id = zonas.sala_id
)
WHERE tenant_id IS NULL;

-- 4. Verificar el resultado de la actualización
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

-- 5. Mostrar zonas actualizadas
SELECT 
  z.id,
  z.nombre,
  z.sala_id,
  s.nombre as nombre_sala,
  r.nombre as nombre_recinto,
  z.tenant_id,
  CASE 
    WHEN z.tenant_id IS NOT NULL THEN '✅ Con tenant_id'
    ELSE '❌ Sin tenant_id'
  END as estado
FROM zonas z
LEFT JOIN salas s ON z.sala_id::text = s.id::text
LEFT JOIN recintos r ON s.recinto_id::text = r.id::text
ORDER BY z.id;

-- 6. Verificar que RLS esté habilitado
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS habilitado'
    ELSE '❌ RLS deshabilitado'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'zonas' 
AND schemaname = 'public';

-- 7. Verificar políticas RLS
SELECT 
  policyname,
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
