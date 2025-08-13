-- Script para verificar y corregir usuarios sin tenant_id asignado
-- Este script debe ejecutarse después de que se haya configurado el sistema de tenants

-- PASO 1: Verificar el estado actual de los usuarios
SELECT 
  'Estado actual de usuarios' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as usuarios_con_tenant,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as usuarios_sin_tenant
FROM profiles;

-- PASO 2: Mostrar usuarios sin tenant_id asignado
SELECT 
  'Usuarios sin tenant_id' as info,
  p.id,
  p.login,
  p.telefono,
  p.created_at,
  p.updated_at
FROM profiles p
WHERE p.tenant_id IS NULL
ORDER BY p.created_at DESC;

-- PASO 3: Verificar que existan tenants en el sistema
SELECT 
  'Tenants disponibles' as info,
  t.id,
  t.company_name,
  t.subdomain,
  t.domain,
  t.status
FROM tenants t
ORDER BY t.created_at;

-- PASO 4: Asignar tenant_id a usuarios que no lo tengan
-- IMPORTANTE: Ejecutar solo después de verificar que hay tenants válidos

-- Opción A: Asignar el primer tenant disponible a todos los usuarios sin tenant
UPDATE profiles 
SET tenant_id = (SELECT id FROM tenants WHERE status = 'active' ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

-- Opción B: Asignar tenant específico por subdominio (más seguro)
-- Primero, crear una función para mapear emails a tenants basado en el subdominio
CREATE OR REPLACE FUNCTION get_tenant_by_email_domain(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  email_domain TEXT;
  tenant_uuid UUID;
BEGIN
  -- Extraer el dominio del email
  email_domain := split_part(user_email, '@', 2);
  
  -- Buscar tenant que coincida con el dominio o subdominio
  SELECT id INTO tenant_uuid
  FROM tenants 
  WHERE (domain = email_domain OR subdomain = split_part(email_domain, '.', 1))
    AND status = 'active'
  LIMIT 1;
  
  RETURN tenant_uuid;
END;
$$ LANGUAGE plpgsql;

-- Usar la función para asignar tenant_id basado en el email
UPDATE profiles 
SET tenant_id = get_tenant_by_email_domain(login)
WHERE tenant_id IS NULL 
  AND get_tenant_by_email_domain(login) IS NOT NULL;

-- PASO 5: Verificar el resultado final
SELECT 
  'Estado final de usuarios' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as usuarios_con_tenant,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as usuarios_sin_tenant
FROM profiles;

-- PASO 6: Mostrar usuarios que aún no tienen tenant_id (requieren asignación manual)
SELECT 
  'Usuarios que requieren asignación manual de tenant' as info,
  p.id,
  p.login,
  p.telefono,
  p.created_at,
  'Asignar tenant_id manualmente' as accion
FROM profiles p
WHERE p.tenant_id IS NULL
ORDER BY p.created_at DESC;

-- PASO 7: Crear índices para mejorar el rendimiento de las consultas por tenant
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_login ON profiles(tenant_id, login);

-- PASO 8: Verificar que las políticas RLS estén funcionando correctamente
-- Esto verifica que los usuarios solo puedan acceder a datos de su tenant
SELECT 
  'Verificación de políticas RLS' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'eventos', 'funciones', 'salas', 'recintos')
ORDER BY tablename, policyname;

-- PASO 9: Crear función para limpiar usuarios huérfanos (opcional)
-- Esta función elimina usuarios que no tienen tenant_id válido
CREATE OR REPLACE FUNCTION cleanup_orphan_users()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM profiles 
  WHERE tenant_id IS NULL 
    OR tenant_id NOT IN (SELECT id FROM tenants);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- NOTA: Ejecutar cleanup_orphan_users() solo si estás seguro de que quieres eliminar usuarios
-- SELECT cleanup_orphan_users() as usuarios_eliminados;

-- PASO 10: Crear vista para monitorear el estado de los tenants
CREATE OR REPLACE VIEW tenant_user_status AS
SELECT 
  t.id as tenant_id,
  t.company_name,
  t.subdomain,
  t.domain,
  t.status as tenant_status,
  COUNT(p.id) as total_users,
  COUNT(CASE WHEN p.tenant_id IS NOT NULL THEN 1 END) as usuarios_asignados,
  COUNT(CASE WHEN p.tenant_id IS NULL THEN 1 END) as usuarios_sin_asignar
FROM tenants t
LEFT JOIN profiles p ON t.id = p.tenant_id
GROUP BY t.id, t.company_name, t.subdomain, t.domain, t.status
ORDER BY t.company_name;

-- Mostrar el estado de todos los tenants
SELECT * FROM tenant_user_status;
