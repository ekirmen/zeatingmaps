-- Script CORREGIDO para crear las tablas faltantes con tenant_id
-- Ejecutar en Supabase SQL Editor DESPUÉS de check_tenants_structure.sql

-- 1. Crear tabla system_alerts
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'warning', 'error', 'success', 'critical')) DEFAULT 'info',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('active', 'resolved', 'dismissed')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Crear tabla audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'info',
    resource_type TEXT,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Crear tabla backups
CREATE TABLE IF NOT EXISTS backups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    backup_type TEXT CHECK (backup_type IN ('manual', 'automatic', 'scheduled')) DEFAULT 'manual',
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
    file_path TEXT,
    file_size BIGINT,
    description TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Crear tabla admin_notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('info', 'warning', 'error', 'success', 'payment', 'user', 'ticket', 'system')) DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    read_by UUID REFERENCES profiles(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 5. Crear tabla notifications (para notificaciones generales)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('info', 'warning', 'error', 'success', 'payment', 'user', 'ticket', 'system')) DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 6. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_system_alerts_tenant_id ON system_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_priority ON system_alerts(priority);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_backups_tenant_id ON backups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_tenant_id ON admin_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 7. Habilitar RLS en todas las tablas
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 8. Crear políticas RLS para system_alerts
CREATE POLICY "Users can view own tenant system alerts" ON system_alerts
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant system alerts" ON system_alerts
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 9. Crear políticas RLS para audit_logs
CREATE POLICY "Users can view own tenant audit logs" ON audit_logs
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert own tenant audit logs" ON audit_logs
FOR INSERT WITH CHECK (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 10. Crear políticas RLS para backups
CREATE POLICY "Users can view own tenant backups" ON backups
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant backups" ON backups
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 11. Crear políticas RLS para admin_notifications
CREATE POLICY "Users can view own tenant admin notifications" ON admin_notifications
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant admin notifications" ON admin_notifications
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 12. Crear políticas RLS para notifications
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (
    user_id = auth.uid() OR
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own notifications" ON notifications
FOR ALL USING (
    user_id = auth.uid() OR
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 13. Insertar datos de ejemplo para testing (SIN usar columnas inexistentes)
DO $$
DECLARE
    first_tenant_id UUID;
BEGIN
    -- Obtener el primer tenant disponible
    SELECT id INTO first_tenant_id FROM tenants LIMIT 1;
    
    -- Solo insertar si hay tenants disponibles
    IF first_tenant_id IS NOT NULL THEN
        -- Insertar alertas del sistema
        INSERT INTO system_alerts (tenant_id, title, message, type, priority, status) VALUES
            (first_tenant_id, 'Sistema Operativo', 'El sistema está funcionando correctamente', 'success', 'low', 'active'),
            (first_tenant_id, 'Mantenimiento Programado', 'Mantenimiento programado para mañana', 'warning', 'medium', 'active');
        
        -- Insertar notificaciones de administrador
        INSERT INTO admin_notifications (tenant_id, title, message, type, priority) VALUES
            (first_tenant_id, 'Bienvenido al Sistema', 'Tu cuenta ha sido configurada exitosamente', 'success', 'low'),
            (first_tenant_id, 'Nuevo Usuario Registrado', 'Se ha registrado un nuevo usuario en el sistema', 'info', 'medium');
        
        RAISE NOTICE '✅ Datos de ejemplo insertados para tenant: %', first_tenant_id;
    ELSE
        RAISE NOTICE '⚠️ No hay tenants disponibles para insertar datos de ejemplo';
    END IF;
END $$;

-- 14. Verificar que las tablas fueron creadas
SELECT 
    table_name,
    CASE
        WHEN rowsecurity THEN '✅ RLS habilitado'
        ELSE '❌ RLS deshabilitado'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND table_name IN ('system_alerts', 'audit_logs', 'backups', 'admin_notifications', 'notifications')
ORDER BY table_name;

-- 15. Verificar políticas RLS creadas
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('system_alerts', 'audit_logs', 'backups', 'admin_notifications', 'notifications')
ORDER BY tablename, policyname;

-- 16. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '🎉 Tablas creadas exitosamente:';
    RAISE NOTICE '✅ system_alerts - Alertas del sistema';
    RAISE NOTICE '✅ audit_logs - Logs de auditoría';
    RAISE NOTICE '✅ backups - Respaldos del sistema';
    RAISE NOTICE '✅ admin_notifications - Notificaciones de administrador';
    RAISE NOTICE '✅ notifications - Notificaciones generales';
    RAISE NOTICE '🔒 RLS habilitado en todas las tablas';
    RAISE NOTICE '📊 Políticas de seguridad configuradas';
    RAISE NOTICE '📋 Ahora puedes usar estas tablas desde el frontend';
END $$;
