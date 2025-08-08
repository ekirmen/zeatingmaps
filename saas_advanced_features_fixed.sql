-- 🚀 Funcionalidades Avanzadas para Panel SaaS - VERSIÓN CORREGIDA
-- Tablas adicionales para notificaciones, tickets de soporte, auditoría, backups y templates

-- =====================================================
-- SISTEMA DE NOTIFICACIONES
-- =====================================================

-- Eliminar tabla si existe y recrear
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general', -- general, admin, tenant, system
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    read BOOLEAN DEFAULT false,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- SISTEMA DE TICKETS DE SOPORTE
-- =====================================================

-- Eliminar tablas si existen y recrear
DROP TABLE IF EXISTS support_responses CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    category VARCHAR(100), -- technical, billing, feature_request, bug_report
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    response_time_hours INTEGER,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    tags TEXT[]
);

CREATE TABLE support_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- true para notas internas
    created_at TIMESTAMP DEFAULT NOW(),
    attachments JSONB DEFAULT '[]'
);

-- =====================================================
-- SISTEMA DE AUDITORÍA
-- =====================================================

-- Eliminar tabla si existe y recrear
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL, -- create, update, delete, login, etc.
    details TEXT,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    resource_type VARCHAR(50), -- tenant, event, user, etc.
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    severity VARCHAR(20) DEFAULT 'info' -- info, warning, error, critical
);

-- =====================================================
-- SISTEMA DE BACKUPS
-- =====================================================

-- Eliminar tablas si existen y recrear
DROP TABLE IF EXISTS backup_schedules CASCADE;
DROP TABLE IF EXISTS backups CASCADE;

CREATE TABLE backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    backup_type VARCHAR(50) DEFAULT 'manual', -- manual, automatic, scheduled
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
    file_size VARCHAR(20),
    file_path VARCHAR(500),
    backup_data JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    retention_days INTEGER DEFAULT 30,
    compression_ratio DECIMAL(5,2),
    checksum VARCHAR(64)
);

CREATE TABLE backup_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    schedule_type VARCHAR(50) DEFAULT 'daily', -- daily, weekly, monthly
    schedule_time TIME DEFAULT '02:00:00',
    is_active BOOLEAN DEFAULT true,
    retention_days INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT NOW(),
    last_run TIMESTAMP,
    next_run TIMESTAMP
);

-- =====================================================
-- SISTEMA DE TEMPLATES DE SOPORTE
-- =====================================================

-- Eliminar tabla si existe y recrear
DROP TABLE IF EXISTS support_templates CASCADE;

CREATE TABLE support_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- billing, technical, feature_request, etc.
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '{}', -- variables que se pueden reemplazar
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- =====================================================
-- SISTEMA DE MÉTRICAS AVANZADAS
-- =====================================================

-- Eliminar tablas si existen y recrear
DROP TABLE IF EXISTS tenant_analytics CASCADE;
DROP TABLE IF EXISTS advanced_metrics CASCADE;

CREATE TABLE advanced_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    metric_date DATE DEFAULT CURRENT_DATE,
    metric_type VARCHAR(100) NOT NULL, -- revenue, events, users, etc.
    metric_value DECIMAL(15,2),
    metric_unit VARCHAR(20), -- count, percentage, currency, etc.
    comparison_period VARCHAR(20), -- previous_day, previous_week, previous_month
    growth_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tenant_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    total_events INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_tickets INTEGER DEFAULT 0,
    avg_response_time DECIMAL(5,2),
    customer_satisfaction DECIMAL(3,2),
    churn_risk_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SISTEMA DE ALERTAS Y MONITOREO
-- =====================================================

-- Eliminar tabla si existe y recrear
DROP TABLE IF EXISTS system_alerts CASCADE;

CREATE TABLE system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(100) NOT NULL, -- performance, security, billing, etc.
    severity VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Notificaciones
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);

-- Tickets de soporte
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);

-- Auditoría
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user_id ON audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Backups
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_tenant_id ON backups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at);

-- Métricas
CREATE INDEX IF NOT EXISTS idx_advanced_metrics_tenant_id ON advanced_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_advanced_metrics_date ON advanced_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_tenant_analytics_tenant_id ON tenant_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_analytics_date ON tenant_analytics(date);

-- Alertas
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_tenant_id ON system_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(is_resolved);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar timestamp de auditoría
CREATE OR REPLACE FUNCTION update_audit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para audit_logs
DROP TRIGGER IF EXISTS update_audit_logs_timestamp ON audit_logs;
CREATE TRIGGER update_audit_logs_timestamp
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION update_audit_timestamp();

-- Función para calcular métricas automáticamente
CREATE OR REPLACE FUNCTION calculate_tenant_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar métricas diarias para el tenant
    INSERT INTO tenant_analytics (
        tenant_id,
        total_events,
        total_users,
        total_revenue,
        total_tickets
    )
    SELECT 
        NEW.tenant_id,
        (SELECT COUNT(*) FROM eventos WHERE tenant_id = NEW.tenant_id),
        (SELECT COUNT(*) FROM usuarios WHERE tenant_id = NEW.tenant_id),
        (SELECT COALESCE(SUM(monto), 0) FROM ventas WHERE tenant_id = NEW.tenant_id),
        (SELECT COUNT(*) FROM support_tickets WHERE tenant_id = NEW.tenant_id)
    ON CONFLICT (tenant_id, date) DO UPDATE SET
        total_events = EXCLUDED.total_events,
        total_users = EXCLUDED.total_users,
        total_revenue = EXCLUDED.total_revenue,
        total_tickets = EXCLUDED.total_tickets;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para crear alertas automáticas
CREATE OR REPLACE FUNCTION create_system_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear alerta si un tenant tiene muchos tickets pendientes
    IF (SELECT COUNT(*) FROM support_tickets 
        WHERE tenant_id = NEW.tenant_id AND status = 'open') > 5 THEN
        
        INSERT INTO system_alerts (
            alert_type,
            severity,
            title,
            message,
            tenant_id
        ) VALUES (
            'support',
            'high',
            'Muchos tickets pendientes',
            'El tenant tiene más de 5 tickets de soporte pendientes',
            NEW.tenant_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para dashboard de soporte
DROP VIEW IF EXISTS support_dashboard;
CREATE OR REPLACE VIEW support_dashboard AS
SELECT 
    t.company_name,
    t.subdomain,
    COUNT(st.id) as total_tickets,
    COUNT(CASE WHEN st.status = 'open' THEN 1 END) as open_tickets,
    COUNT(CASE WHEN st.status = 'resolved' THEN 1 END) as resolved_tickets,
    AVG(st.response_time_hours) as avg_response_time,
    AVG(st.satisfaction_rating) as avg_satisfaction
FROM tenants t
LEFT JOIN support_tickets st ON t.id = st.tenant_id
GROUP BY t.id, t.company_name, t.subdomain;

-- Vista para métricas de rendimiento
DROP VIEW IF EXISTS performance_metrics;
CREATE OR REPLACE VIEW performance_metrics AS
SELECT 
    t.company_name,
    ta.date,
    ta.total_events,
    ta.total_users,
    ta.total_revenue,
    ta.customer_satisfaction,
    ta.churn_risk_score
FROM tenants t
JOIN tenant_analytics ta ON t.id = ta.tenant_id
ORDER BY ta.date DESC;

-- Vista para alertas activas
DROP VIEW IF EXISTS active_alerts;
CREATE OR REPLACE VIEW active_alerts AS
SELECT 
    sa.*,
    t.company_name,
    t.subdomain
FROM system_alerts sa
LEFT JOIN tenants t ON sa.tenant_id = t.id
WHERE sa.is_resolved = false
ORDER BY sa.severity DESC, sa.created_at DESC;

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

-- Insertar algunos templates de soporte de ejemplo
INSERT INTO support_templates (name, category, subject, content) VALUES
('Problema de Facturación', 'billing', 'Resolución de problema de facturación', 
'Estimado cliente,\n\nHemos revisado su consulta sobre facturación y hemos resuelto el problema. Su cuenta ha sido actualizada correctamente.\n\nSaludos cordiales,\nEquipo de Soporte'),

('Problema Técnico', 'technical', 'Resolución de problema técnico', 
'Estimado cliente,\n\nHemos identificado y resuelto el problema técnico que reportó. El sistema debería funcionar correctamente ahora.\n\nSi persiste algún problema, no dude en contactarnos.\n\nSaludos cordiales,\nEquipo de Soporte'),

('Solicitud de Característica', 'feature_request', 'Respuesta a solicitud de característica', 
'Estimado cliente,\n\nGracias por su sugerencia. Hemos registrado su solicitud y la evaluaremos para futuras actualizaciones.\n\nSaludos cordiales,\nEquipo de Soporte');

-- Insertar algunas notificaciones de ejemplo
INSERT INTO notifications (title, message, type, priority) VALUES
('Nuevo tenant registrado', 'Se ha registrado una nueva empresa en la plataforma', 'admin', 'normal'),
('Ticket de soporte urgente', 'Hay un ticket de soporte marcado como urgente que requiere atención', 'admin', 'high'),
('Backup completado', 'Se ha completado el backup automático de todos los tenants', 'admin', 'low');
