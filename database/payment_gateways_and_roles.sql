-- =====================================================
-- TABLAS PARA PASARELAS DE PAGO Y CONTROL DE ACCESO
-- =====================================================

-- Tabla de configuración de pasarelas de pago
CREATE TABLE IF NOT EXISTS payment_gateway_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway_name VARCHAR(50) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gateway_name, tenant_id)
);

-- Tabla de roles personalizados
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  level INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de políticas de acceso
CREATE TABLE IF NOT EXISTS access_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  conditions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de sesiones de usuario
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para payment_gateway_configs
CREATE INDEX IF NOT EXISTS idx_payment_gateway_configs_gateway ON payment_gateway_configs(gateway_name);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_configs_tenant ON payment_gateway_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_configs_active ON payment_gateway_configs(is_active);

-- Índices para custom_roles
CREATE INDEX IF NOT EXISTS idx_custom_roles_name ON custom_roles(name);
CREATE INDEX IF NOT EXISTS idx_custom_roles_level ON custom_roles(level);
CREATE INDEX IF NOT EXISTS idx_custom_roles_active ON custom_roles(is_active);

-- Índices para access_policies
CREATE INDEX IF NOT EXISTS idx_access_policies_resource ON access_policies(resource);
CREATE INDEX IF NOT EXISTS idx_access_policies_action ON access_policies(action);
CREATE INDEX IF NOT EXISTS idx_access_policies_active ON access_policies(is_active);

-- Índices para user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE payment_gateway_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para payment_gateway_configs
DROP POLICY IF EXISTS "Users can view their tenant's gateway configs" ON payment_gateway_configs;
CREATE POLICY "Users can view their tenant's gateway configs" ON payment_gateway_configs
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR
    tenant_id IS NULL
  );

DROP POLICY IF EXISTS "Super admins can manage all gateway configs" ON payment_gateway_configs;
CREATE POLICY "Super admins can manage all gateway configs" ON payment_gateway_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Políticas para custom_roles
DROP POLICY IF EXISTS "Super admins can manage custom roles" ON custom_roles;
CREATE POLICY "Super admins can manage custom roles" ON custom_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view custom roles" ON custom_roles;
CREATE POLICY "Admins can view custom roles" ON custom_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- Políticas para access_policies
DROP POLICY IF EXISTS "Super admins can manage access policies" ON access_policies;
CREATE POLICY "Super admins can manage access policies" ON access_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view access policies" ON access_policies;
CREATE POLICY "Admins can view access policies" ON access_policies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- Políticas para user_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins can manage all sessions" ON user_sessions;
CREATE POLICY "Super admins can manage all sessions" ON user_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_payment_gateway_configs_updated_at ON payment_gateway_configs;
CREATE TRIGGER update_payment_gateway_configs_updated_at BEFORE UPDATE ON payment_gateway_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_roles_updated_at ON custom_roles;
CREATE TRIGGER update_custom_roles_updated_at BEFORE UPDATE ON custom_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_access_policies_updated_at ON access_policies;
CREATE TRIGGER update_access_policies_updated_at BEFORE UPDATE ON access_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Función para crear sesión de usuario
CREATE OR REPLACE FUNCTION create_user_session(
    p_user_id UUID,
    p_session_token VARCHAR(255),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_expires_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO user_sessions (
        user_id,
        session_token,
        ip_address,
        user_agent,
        expires_at
    ) VALUES (
        p_user_id,
        p_session_token,
        p_ip_address,
        p_user_agent,
        NOW() + (p_expires_hours || ' hours')::INTERVAL
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ language 'plpgsql';

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Configuraciones por defecto de pasarelas (globales)
INSERT INTO payment_gateway_configs (gateway_name, tenant_id, config, is_active) VALUES
('stripe', NULL, '{"test_mode": true, "currency": "USD"}', false),
('paypal', NULL, '{"sandbox_mode": true, "currency": "USD"}', false),
('mercadopago', NULL, '{"sandbox_mode": true, "currency": "MXN"}', false)
ON CONFLICT (gateway_name, tenant_id) DO NOTHING;

-- Políticas de acceso por defecto
INSERT INTO access_policies (name, description, resource, action, conditions, is_active) VALUES
('Admin Tenant Access', 'Administradores pueden gestionar tenants', 'tenant', 'write', '{"roles": ["super_admin", "admin"]}', true),
('View Analytics', 'Usuarios con nivel 40+ pueden ver analytics', 'analytics', 'read', '{"permissions": ["analytics:read"]}', true),
('Support Access', 'Solo soporte y super admins pueden gestionar tickets', 'support', 'write', '{"roles": ["super_admin", "support"]}', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE payment_gateway_configs IS 'Configuraciones de pasarelas de pago por tenant';
COMMENT ON TABLE custom_roles IS 'Roles personalizados del sistema';
COMMENT ON TABLE access_policies IS 'Políticas de acceso granular a recursos';
COMMENT ON TABLE user_sessions IS 'Sesiones activas de usuarios';
