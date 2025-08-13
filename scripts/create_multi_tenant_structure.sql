-- Script para implementar múltiples tenants por usuario
-- Este script crea la estructura necesaria para que un usuario pueda acceder a múltiples empresas

-- PASO 1: Crear tabla intermedia para manejar múltiples tenants por usuario
CREATE TABLE IF NOT EXISTS user_tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'usuario',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- Indica si es el tenant principal del usuario
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Asegurar que un usuario no tenga el mismo tenant duplicado
  UNIQUE(user_id, tenant_id)
);

-- PASO 2: Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_active ON user_tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_user_tenants_primary ON user_tenants(is_primary);

-- PASO 3: Crear función para obtener el tenant activo del usuario
CREATE OR REPLACE FUNCTION get_user_active_tenant(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  active_tenant_id UUID;
BEGIN
  -- Primero intentar obtener el tenant principal
  SELECT tenant_id INTO active_tenant_id
  FROM user_tenants
  WHERE user_id = user_uuid AND is_primary = true AND is_active = true
  LIMIT 1;
  
  -- Si no hay tenant principal, obtener el primer tenant activo
  IF active_tenant_id IS NULL THEN
    SELECT tenant_id INTO active_tenant_id
    FROM user_tenants
    WHERE user_id = user_uuid AND is_active = true
    ORDER BY created_at
    LIMIT 1;
  END IF;
  
  RETURN active_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4: Crear función para verificar si un usuario tiene acceso a un tenant
CREATE OR REPLACE FUNCTION user_has_tenant_access(user_uuid UUID, target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_tenants
    WHERE user_id = user_uuid 
      AND tenant_id = target_tenant_id 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Crear función para cambiar el tenant activo del usuario
CREATE OR REPLACE FUNCTION switch_user_tenant(user_uuid UUID, new_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Verificar que el usuario tenga acceso al nuevo tenant
  has_access := user_has_tenant_access(user_uuid, new_tenant_id);
  
  IF has_access THEN
    -- Desactivar tenant principal anterior
    UPDATE user_tenants 
    SET is_primary = false 
    WHERE user_id = user_uuid AND is_primary = true;
    
    -- Activar nuevo tenant principal
    UPDATE user_tenants 
    SET is_primary = true 
    WHERE user_id = user_uuid AND tenant_id = new_tenant_id;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 6: Crear función para agregar un tenant a un usuario
CREATE OR REPLACE FUNCTION add_user_to_tenant(
  user_uuid UUID, 
  tenant_uuid UUID, 
  user_role VARCHAR DEFAULT 'usuario',
  user_permissions JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  is_first_tenant BOOLEAN;
BEGIN
  -- Verificar si es el primer tenant del usuario
  SELECT COUNT(*) = 0 INTO is_first_tenant
  FROM user_tenants
  WHERE user_id = user_uuid;
  
  -- Insertar o actualizar la relación usuario-tenant
  INSERT INTO user_tenants (user_id, tenant_id, role, permissions, is_primary)
  VALUES (user_uuid, tenant_uuid, user_role, user_permissions, is_first_tenant)
  ON CONFLICT (user_id, tenant_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    is_active = true,
    updated_at = NOW();
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 7: Crear función para remover un tenant de un usuario
CREATE OR REPLACE FUNCTION remove_user_from_tenant(user_uuid UUID, tenant_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  was_primary BOOLEAN;
  next_tenant_id UUID;
BEGIN
  -- Verificar si era el tenant principal
  SELECT is_primary INTO was_primary
  FROM user_tenants
  WHERE user_id = user_uuid AND tenant_id = tenant_uuid;
  
  -- Remover la relación
  DELETE FROM user_tenants
  WHERE user_id = user_uuid AND tenant_id = tenant_uuid;
  
  -- Si era el principal, asignar otro tenant como principal
  IF was_primary THEN
    -- Obtener el siguiente tenant más antiguo
    SELECT tenant_id INTO next_tenant_id
    FROM user_tenants
    WHERE user_id = user_uuid
    ORDER BY created_at
    LIMIT 1;
    
    -- Si hay otro tenant, marcarlo como principal
    IF next_tenant_id IS NOT NULL THEN
      UPDATE user_tenants 
      SET is_primary = true 
      WHERE user_id = user_uuid AND tenant_id = next_tenant_id;
    END IF;
  END IF;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 8: Crear vista para mostrar usuarios y sus tenants
CREATE OR REPLACE VIEW user_tenants_overview AS
SELECT 
  u.id as user_id,
  u.email,
  p.login,
  p.telefono,
  ut.tenant_id,
  t.company_name,
  t.subdomain,
  t.domain,
  ut.role,
  ut.permissions,
  ut.is_active,
  ut.is_primary,
  ut.created_at as user_tenant_created,
  p.created_at as user_created
FROM auth.users u
JOIN profiles p ON u.id = p.id
JOIN user_tenants ut ON u.id = ut.user_id
JOIN tenants t ON ut.tenant_id = t.id
ORDER BY u.email, ut.is_primary DESC, ut.created_at;

-- PASO 9: Crear función para migrar usuarios existentes
-- Esta función asigna automáticamente el tenant actual a usuarios existentes
CREATE OR REPLACE FUNCTION migrate_existing_users_to_tenants()
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER := 0;
  user_record RECORD;
  current_tenant_id UUID;
BEGIN
  -- Obtener el tenant actual basado en el contexto
  -- En este caso, usaremos el primer tenant activo
  SELECT id INTO current_tenant_id
  FROM tenants
  WHERE status = 'active'
  ORDER BY created_at
  LIMIT 1;
  
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No hay tenants activos en el sistema';
  END IF;
  
  -- Migrar usuarios que no tienen tenant asignado
  FOR user_record IN 
    SELECT p.id, p.login, p.telefono, p.permisos
    FROM profiles p
    WHERE p.tenant_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM user_tenants ut 
        WHERE ut.user_id = p.id AND ut.tenant_id = p.tenant_id
      )
  LOOP
    -- Agregar usuario al tenant existente
    IF add_user_to_tenant(
      user_record.id, 
      user_record.tenant_id, 
      COALESCE(user_record.permisos->>'role', 'usuario'),
      user_record.permisos
    ) THEN
      migrated_count := migrated_count + 1;
    END IF;
  END LOOP;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 10: Crear políticas RLS para la nueva tabla
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios tenants
CREATE POLICY "Users can view their own tenant relationships" ON user_tenants
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los administradores puedan gestionar todas las relaciones
CREATE POLICY "Admins can manage all user-tenant relationships" ON user_tenants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND (permisos->>'role' = 'admin' OR permisos->>'role' = 'super_admin')
    )
  );

-- PASO 11: Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_user_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_tenants_updated_at
  BEFORE UPDATE ON user_tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tenants_updated_at();

-- PASO 12: Ejecutar migración de usuarios existentes
-- NOTA: Descomentar la siguiente línea solo después de verificar que todo esté configurado
-- SELECT migrate_existing_users_to_tenants() as usuarios_migrados;

-- PASO 13: Mostrar el estado actual
SELECT 
  'Estado de la migración' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN ut.tenant_id IS NOT NULL THEN 1 END) as usuarios_con_tenant_relacion,
  COUNT(CASE WHEN ut.tenant_id IS NULL THEN 1 END) as usuarios_sin_tenant_relacion
FROM profiles p
LEFT JOIN user_tenants ut ON p.id = ut.user_id;

-- Mostrar usuarios y sus tenants
SELECT * FROM user_tenants_overview LIMIT 10;
