-- 🚀 Actualización del Esquema para Gestión Avanzada de Usuarios (VERSIÓN FINAL)
-- Este script se adapta a la estructura real de la tabla profiles
-- Basado en la estructura: id, login, full_name, telefono, empresa, perfil, permisos, formadepago, etc.

-- =====================================================
-- VERIFICAR Y ACTUALIZAR TABLA PROFILES
-- =====================================================

-- Agregar campo para nombre si no existe (usando full_name como base)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'nombre') THEN
        ALTER TABLE profiles ADD COLUMN nombre VARCHAR(255);
        -- Copiar datos de full_name a nombre si existe
        UPDATE profiles SET nombre = full_name WHERE full_name IS NOT NULL;
    END IF;
END $$;

-- Agregar campo para apellido si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'apellido') THEN
        ALTER TABLE profiles ADD COLUMN apellido VARCHAR(255);
    END IF;
END $$;

-- Agregar campo para email si no existe (se obtiene de auth.users)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE profiles ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

-- Agregar campo para estado activo
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Agregar campo para canales de acceso
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS canales JSONB DEFAULT '{
  "boxOffice": false,
  "internet": false,
  "marcaBlanca": false,
  "test": false
}'::jsonb;

-- Actualizar permisos existentes si no tienen la estructura completa
DO $$
BEGIN
    -- Si permisos existe pero no tiene la estructura completa, actualizarlo
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'permisos') THEN
        -- Actualizar registros que no tienen la estructura completa de permisos
        UPDATE profiles 
        SET permisos = COALESCE(permisos, '{}'::jsonb) || '{
          "ADMIN": false,
          "SUPER": false,
          "MG_USERS": false,
          "MG_ORGS": false,
          "MG_VENUES": false,
          "MG_USER_FEES": false,
          "MG_SELLER_FEES": false,
          "MG_SETTLEMENTS": false,
          "CUSTOMIZATION": false,
          "CRM": false,
          "ACCREDITATIONS": false,
          "REPORTS": false,
          "PROGRAMMING": false,
          "MG_EVENTS": false,
          "PR_USER_FEES": false,
          "MG_QUOTAS": false,
          "MG_PROMO": false,
          "MG_SURVEYS": false,
          "MG_VIRTUAL_QUEUES": false,
          "SELL": false,
          "CANCEL": false,
          "REFUND": false,
          "REPRINT": false,
          "SEARCH_ORDERS": false,
          "UNPAID_BOOKINGS": false,
          "MULTI_EVENT_ORDER": false,
          "BLOCK": false,
          "SHOW_EVENT_ACTIVITY": false
        }'::jsonb
        WHERE permisos IS NULL OR jsonb_typeof(permisos) != 'object';
    ELSE
        -- Si no existe la columna permisos, crearla
        ALTER TABLE profiles ADD COLUMN permisos JSONB DEFAULT '{
          "ADMIN": false,
          "SUPER": false,
          "MG_USERS": false,
          "MG_ORGS": false,
          "MG_VENUES": false,
          "MG_USER_FEES": false,
          "MG_SELLER_FEES": false,
          "MG_SETTLEMENTS": false,
          "CUSTOMIZATION": false,
          "CRM": false,
          "ACCREDITATIONS": false,
          "REPORTS": false,
          "PROGRAMMING": false,
          "MG_EVENTS": false,
          "PR_USER_FEES": false,
          "MG_QUOTAS": false,
          "MG_PROMO": false,
          "MG_SURVEYS": false,
          "MG_VIRTUAL_QUEUES": false,
          "SELL": false,
          "CANCEL": false,
          "REFUND": false,
          "REPRINT": false,
          "SEARCH_ORDERS": false,
          "UNPAID_BOOKINGS": false,
          "MULTI_EVENT_ORDER": false,
          "BLOCK": false,
          "SHOW_EVENT_ACTIVITY": false
        }'::jsonb;
    END IF;
END $$;

-- Agregar campo para métodos de pago (usando formadepago como base)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS metodosPago JSONB DEFAULT '{
  "efectivo": false,
  "zelle": false,
  "pagoMovil": false,
  "paypal": false,
  "puntoVenta": false,
  "procesadorPago": false
}'::jsonb;

-- Agregar campo para recintos asignados
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recintos UUID[] DEFAULT '{}';

-- =====================================================
-- CREAR TABLA DE RECINTOS SI NO EXISTE
-- =====================================================

CREATE TABLE IF NOT EXISTS recintos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    capacidad INTEGER,
    ciudad VARCHAR(100),
    estado VARCHAR(100),
    pais VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE
);

-- =====================================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_nombre ON profiles(nombre);
CREATE INDEX IF NOT EXISTS idx_profiles_apellido ON profiles(apellido);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_activo ON profiles(activo);
CREATE INDEX IF NOT EXISTS idx_profiles_canales ON profiles USING GIN(canales);
CREATE INDEX IF NOT EXISTS idx_profiles_permisos ON profiles USING GIN(permisos);
CREATE INDEX IF NOT EXISTS idx_profiles_metodos_pago ON profiles USING GIN(metodosPago);
CREATE INDEX IF NOT EXISTS idx_profiles_recintos ON profiles USING GIN(recintos);
CREATE INDEX IF NOT EXISTS idx_recintos_tenant_id ON recintos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recintos_nombre ON recintos(nombre);

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para verificar si un usuario tiene un permiso específico
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT permisos INTO user_permissions
    FROM profiles
    WHERE id = user_id;
    
    IF user_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN COALESCE(user_permissions->>permission_name, 'false')::BOOLEAN;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un usuario tiene acceso a un recinto
CREATE OR REPLACE FUNCTION user_has_venue_access(user_id UUID, venue_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_venues UUID[];
BEGIN
    SELECT recintos INTO user_venues
    FROM profiles
    WHERE id = user_id;
    
    IF user_venues IS NULL OR array_length(user_venues, 1) IS NULL THEN
        RETURN TRUE; -- Si no hay recintos específicos, tiene acceso a todos
    END IF;
    
    RETURN venue_id = ANY(user_venues);
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un usuario tiene acceso a un canal
CREATE OR REPLACE FUNCTION user_has_channel_access(user_id UUID, channel_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_channels JSONB;
BEGIN
    SELECT canales INTO user_channels
    FROM profiles
    WHERE id = user_id;
    
    IF user_channels IS NULL THEN
        RETURN TRUE; -- Si no hay canales específicos, tiene acceso a todos
    END IF;
    
    -- Si no hay canales seleccionados, tiene acceso a todos
    IF NOT (user_channels ? 'boxOffice' OR user_channels ? 'internet' OR 
             user_channels ? 'marcaBlanca' OR user_channels ? 'test') THEN
        RETURN TRUE;
    END IF;
    
    RETURN COALESCE(user_channels->>channel_name, 'false')::BOOLEAN;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener el email del usuario desde auth.users
CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id;
    
    RETURN user_email;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para usuarios activos con sus permisos (incluye email desde auth.users)
CREATE OR REPLACE VIEW active_users_permissions AS
SELECT 
    p.id,
    p.login,
    p.nombre,
    p.apellido,
    p.full_name,
    au.email,
    p.telefono,
    p.empresa,
    p.perfil,
    p.activo,
    p.permisos,
    p.canales,
    p.metodosPago,
    p.recintos
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.activo = true;

-- Vista para usuarios por perfil
CREATE OR REPLACE VIEW users_by_profile AS
SELECT 
    p.perfil,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE p.activo = true) as active_users
FROM profiles p
GROUP BY p.perfil;

-- Vista para obtener usuarios con email completo
CREATE OR REPLACE VIEW profiles_with_email AS
SELECT 
    p.*,
    au.email
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar algunos recintos de ejemplo si no existen
INSERT INTO recintos (nombre, ciudad, estado, pais, capacidad) 
VALUES 
    ('Estadio Olímpico', 'Caracas', 'Distrito Capital', 'Venezuela', 50000),
    ('Teatro Teresa Carreño', 'Caracas', 'Distrito Capital', 'Venezuela', 3000),
    ('Poliedro de Caracas', 'Caracas', 'Distrito Capital', 'Venezuela', 15000),
    ('Centro de Eventos', 'Valencia', 'Carabobo', 'Venezuela', 2000)
ON CONFLICT DO NOTHING;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD RLS (SI SE USA)
-- =====================================================

-- Habilitar RLS en las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recintos ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles (ajustar según necesidades)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND permisos->>'ADMIN' = 'true'
        )
    );

-- Políticas para recintos
DROP POLICY IF EXISTS "Users can view venues" ON recintos;
CREATE POLICY "Users can view venues" ON recintos
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage venues" ON recintos;
CREATE POLICY "Admins can manage venues" ON recintos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND permisos->>'MG_VENUES' = 'true'
        )
    );

-- =====================================================
-- TRIGGERS PARA MANTENER CONSISTENCIA
-- =====================================================

-- Trigger para actualizar updated_at en profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- Trigger para actualizar updated_at en recintos
CREATE OR REPLACE FUNCTION update_recintos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_recintos_updated_at ON recintos;
CREATE TRIGGER update_recintos_updated_at
    BEFORE UPDATE ON recintos
    FOR EACH ROW EXECUTE FUNCTION update_recintos_updated_at();

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

COMMENT ON TABLE profiles IS 'Tabla de perfiles de usuario con permisos avanzados';
COMMENT ON COLUMN profiles.nombre IS 'Nombre del usuario';
COMMENT ON COLUMN profiles.apellido IS 'Apellido del usuario';
COMMENT ON COLUMN profiles.full_name IS 'Nombre completo del usuario';
COMMENT ON COLUMN profiles.activo IS 'Estado activo/inactivo del usuario';
COMMENT ON COLUMN profiles.canales IS 'Canales de acceso permitidos (JSONB)';
COMMENT ON COLUMN profiles.permisos IS 'Permisos detallados del usuario (JSONB)';
COMMENT ON COLUMN profiles.metodosPago IS 'Métodos de pago permitidos (JSONB)';
COMMENT ON COLUMN profiles.recintos IS 'Array de IDs de recintos permitidos';

COMMENT ON TABLE recintos IS 'Tabla de recintos/venues del sistema';
COMMENT ON COLUMN recintos.tenant_id IS 'ID del tenant propietario del recinto';

-- =====================================================
-- MENSAJE DE ÉXITO
-- =====================================================

SELECT '✅ Esquema de gestión de usuarios actualizado exitosamente' as status;
