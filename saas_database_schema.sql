-- 🚀 Esquema de Base de Datos para SaaS Multi-Tenant
-- Este archivo contiene todas las tablas necesarias para convertir tu ticketera en una plataforma SaaS

-- =====================================================
-- TABLAS PRINCIPALES PARA MULTI-TENANT
-- =====================================================

-- Tabla de empresas/tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    plan_type VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    settings JSONB DEFAULT '{}',
    billing_info JSONB DEFAULT '{}',
    stripe_customer_id VARCHAR(255),
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#1890ff',
    secondary_color VARCHAR(7) DEFAULT '#52c41a'
);

-- Tabla de suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, past_due
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de facturas
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, cancelled
    due_date TIMESTAMP,
    paid_date TIMESTAMP,
    invoice_number VARCHAR(100) UNIQUE,
    description TEXT,
    stripe_invoice_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de uso/métricas
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL, -- events_created, tickets_sold, etc.
    metric_value INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de límites por plan
CREATE TABLE IF NOT EXISTS plan_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_type VARCHAR(50) NOT NULL,
    limit_name VARCHAR(100) NOT NULL, -- events_per_month, tickets_per_event, etc.
    limit_value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- MODIFICAR TABLAS EXISTENTES PARA MULTI-TENANT
-- =====================================================

-- Agregar tenant_id a las tablas existentes
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE funciones ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE salas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE mapas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE sillas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Agregar tenant_id a las nuevas tablas de formularios personalizados
ALTER TABLE custom_forms ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE mailchimp_configs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE mailchimp_subscriptions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE push_notifications_config ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE push_notifications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para tenants
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_type ON tenants(plan_type);

-- Índices para suscripciones
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Índices para facturas
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_id ON invoices(stripe_invoice_id);

-- Índices para métricas de uso
CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant_id ON usage_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_date ON usage_metrics(date);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_name ON usage_metrics(metric_name);

-- Índices para tablas existentes con tenant_id
CREATE INDEX IF NOT EXISTS idx_eventos_tenant_id ON eventos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_tenant_id ON usuarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_productos_tenant_id ON productos(tenant_id);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar límites por plan
INSERT INTO plan_limits (plan_type, limit_name, limit_value) VALUES
('basic', 'events_per_month', 5),
('basic', 'tickets_per_event', 100),
('basic', 'storage_gb', 1),
('basic', 'users_limit', 3),
('pro', 'events_per_month', -1), -- ilimitado
('pro', 'tickets_per_event', 1000),
('pro', 'storage_gb', 10),
('pro', 'users_limit', 10),
('enterprise', 'events_per_month', -1),
('enterprise', 'tickets_per_event', -1),
('enterprise', 'storage_gb', 100),
('enterprise', 'users_limit', -1)
ON CONFLICT DO NOTHING;

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

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar número de factura automáticamente
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.invoice_number := 'INV-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                         LPAD(CAST(nextval('invoice_sequence') AS TEXT), 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Secuencia para números de factura
CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1;

-- Trigger para generar número de factura
DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON invoices;
CREATE TRIGGER generate_invoice_number_trigger
    BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- Políticas para tenants (solo super admin puede ver todos)
DROP POLICY IF EXISTS "Super admin can manage all tenants" ON tenants;
CREATE POLICY "Super admin can manage all tenants" ON tenants
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM admin_users WHERE role = 'super_admin'
    ));

-- Políticas para suscripciones
DROP POLICY IF EXISTS "Tenants can view their own subscriptions" ON subscriptions;
CREATE POLICY "Tenants can view their own subscriptions" ON subscriptions
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE contact_email = auth.email()
    ));

-- Políticas para facturas
DROP POLICY IF EXISTS "Tenants can view their own invoices" ON invoices;
CREATE POLICY "Tenants can view their own invoices" ON invoices
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE contact_email = auth.email()
    ));

-- Políticas para métricas de uso
DROP POLICY IF EXISTS "Tenants can view their own metrics" ON usage_metrics;
CREATE POLICY "Tenants can view their own metrics" ON usage_metrics
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE contact_email = auth.email()
    ));

-- Políticas para límites de plan (lectura pública)
DROP POLICY IF EXISTS "Anyone can view plan limits" ON plan_limits;
CREATE POLICY "Anyone can view plan limits" ON plan_limits
    FOR SELECT USING (true);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para dashboard de administración
CREATE OR REPLACE VIEW tenant_dashboard AS
SELECT 
    t.id,
    t.subdomain,
    t.company_name,
    t.contact_email,
    t.plan_type,
    t.status,
    t.created_at,
    s.plan_name,
    s.price,
    s.billing_cycle,
    s.status as subscription_status,
    COUNT(e.id) as total_events,
    COUNT(u.id) as total_users,
    COALESCE(SUM(um.metric_value), 0) as total_tickets_sold
FROM tenants t
LEFT JOIN subscriptions s ON t.id = s.tenant_id AND s.status = 'active'
LEFT JOIN eventos e ON t.id = e.tenant_id
LEFT JOIN usuarios u ON t.id = u.tenant_id
LEFT JOIN usage_metrics um ON t.id = um.tenant_id AND um.metric_name = 'tickets_sold'
GROUP BY t.id, t.subdomain, t.company_name, t.contact_email, t.plan_type, 
         t.status, t.created_at, s.plan_name, s.price, s.billing_cycle, s.status;

-- Vista para métricas de ingresos
CREATE OR REPLACE VIEW revenue_metrics AS
SELECT 
    DATE_TRUNC('month', i.created_at) as month,
    COUNT(DISTINCT i.tenant_id) as active_tenants,
    SUM(i.amount) as total_revenue,
    AVG(i.amount) as avg_revenue_per_tenant
FROM invoices i
WHERE i.status = 'paid'
GROUP BY DATE_TRUNC('month', i.created_at)
ORDER BY month DESC;

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para obtener límites de un tenant
CREATE OR REPLACE FUNCTION get_tenant_limits(tenant_uuid UUID)
RETURNS TABLE(limit_name VARCHAR, limit_value INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT pl.limit_name, pl.limit_value
    FROM tenants t
    JOIN plan_limits pl ON t.plan_type = pl.plan_type
    WHERE t.id = tenant_uuid;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un tenant puede crear más eventos
CREATE OR REPLACE FUNCTION can_create_event(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    events_limit INTEGER;
    current_events INTEGER;
BEGIN
    -- Obtener límite de eventos del plan
    SELECT limit_value INTO events_limit
    FROM plan_limits
    WHERE plan_type = (SELECT plan_type FROM tenants WHERE id = tenant_uuid)
    AND limit_name = 'events_per_month';
    
    -- Si es ilimitado (-1), permitir
    IF events_limit = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Contar eventos del mes actual
    SELECT COUNT(*) INTO current_events
    FROM eventos
    WHERE tenant_id = tenant_uuid
    AND created_at >= DATE_TRUNC('month', NOW());
    
    RETURN current_events < events_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE tenants IS 'Tabla principal de empresas/tenants del sistema SaaS';
COMMENT ON TABLE subscriptions IS 'Suscripciones activas de cada tenant';
COMMENT ON TABLE invoices IS 'Facturas generadas para cada tenant';
COMMENT ON TABLE usage_metrics IS 'Métricas de uso por tenant';
COMMENT ON TABLE plan_limits IS 'Límites definidos para cada tipo de plan';

COMMENT ON COLUMN tenants.subdomain IS 'Subdominio único para cada tenant (ej: empresa1.ticketera.com)';
COMMENT ON COLUMN tenants.plan_type IS 'Tipo de plan: basic, pro, enterprise';
COMMENT ON COLUMN tenants.status IS 'Estado del tenant: active, suspended, cancelled';
COMMENT ON COLUMN tenants.settings IS 'Configuraciones personalizadas del tenant en formato JSON';
COMMENT ON COLUMN tenants.billing_info IS 'Información de facturación del tenant en formato JSON';

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================

-- Para aplicar este esquema, ejecuta este archivo en tu editor SQL de Supabase
-- o usa el comando: psql -h your-host -U your-user -d your-database -f saas_database_schema.sql
