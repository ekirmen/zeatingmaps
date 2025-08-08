-- 🚀 Fix para el Panel SaaS
-- Este script arregla los problemas del panel SaaS

-- =====================================================
-- AGREGAR COLUMNAS FALTANTES A TENANTS
-- =====================================================

-- Agregar columna total_revenue si no existe
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0.00;

-- Agregar columna monthly_revenue si no existe
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS monthly_revenue DECIMAL(10,2) DEFAULT 0.00;

-- Agregar columna yearly_revenue si no existe
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS yearly_revenue DECIMAL(10,2) DEFAULT 0.00;

-- Agregar columna subscription_status si no existe
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';

-- =====================================================
-- CREAR TABLA SYSTEM_ALERTS
-- =====================================================

-- Crear tabla system_alerts si no existe
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    alert_type VARCHAR(50) DEFAULT 'info',
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para system_alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_tenant_id ON system_alerts(tenant_id);

-- =====================================================
-- CONFIGURAR POLÍTICAS RLS PARA TENANTS
-- =====================================================

-- Habilitar RLS en tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Enable read access for all users" ON tenants;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tenants;
DROP POLICY IF EXISTS "Enable update for users based on email" ON tenants;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON tenants;
DROP POLICY IF EXISTS "Super admin can manage all tenants" ON tenants;
DROP POLICY IF EXISTS "Tenant admins can view their own tenant" ON tenants;

-- Crear políticas más permisivas para el panel SaaS
CREATE POLICY "Enable read access for all users" ON tenants
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON tenants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON tenants
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON tenants
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- CONFIGURAR POLÍTICAS RLS PARA SYSTEM_ALERTS
-- =====================================================

-- Habilitar RLS en system_alerts
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Crear políticas para system_alerts
CREATE POLICY "Enable read access for all users" ON system_alerts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON system_alerts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON system_alerts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON system_alerts
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- ACTUALIZAR DATOS EXISTENTES
-- =====================================================

-- Actualizar tenants existentes con valores por defecto
UPDATE tenants 
SET 
    total_revenue = COALESCE(total_revenue, 0.00),
    monthly_revenue = COALESCE(monthly_revenue, 0.00),
    yearly_revenue = COALESCE(yearly_revenue, 0.00),
    subscription_status = COALESCE(subscription_status, 'active')
WHERE total_revenue IS NULL OR monthly_revenue IS NULL OR yearly_revenue IS NULL OR subscription_status IS NULL;

-- =====================================================
-- INSERTAR DATOS DE PRUEBA PARA SYSTEM_ALERTS
-- =====================================================

-- Insertar algunos alerts de prueba
INSERT INTO system_alerts (
    title,
    message,
    alert_type
)
VALUES 
    ('Sistema Operativo', 'Todos los sistemas funcionando correctamente', 'success'),
    ('Mantenimiento Programado', 'Mantenimiento programado para el próximo fin de semana', 'warning'),
    ('Nueva Funcionalidad', 'Nueva función de reportes disponible', 'info')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAR ESTRUCTURA ACTUALIZADA
-- =====================================================

-- Verificar estructura de tenants
SELECT 
    'TENANTS' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- Verificar estructura de system_alerts
SELECT 
    'SYSTEM_ALERTS' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'system_alerts' 
ORDER BY ordinal_position;

-- Verificar datos de tenants
SELECT 
    'TENANTS DATA' as tipo,
    COUNT(*) as total_tenants,
    COUNT(*) FILTER (WHERE status = 'active') as active_tenants,
    COUNT(*) FILTER (WHERE subscription_status = 'active') as active_subscriptions
FROM tenants;

-- Verificar datos de system_alerts
SELECT 
    'SYSTEM_ALERTS DATA' as tipo,
    COUNT(*) as total_alerts,
    COUNT(*) FILTER (WHERE alert_type = 'success') as success_alerts,
    COUNT(*) FILTER (WHERE alert_type = 'warning') as warning_alerts
FROM system_alerts;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto arreglará los problemas del panel SaaS
3. Verifica que puedas acceder al panel SaaS sin errores

PROBLEMAS RESUELTOS:
- ✅ Columna total_revenue agregada a tenants
- ✅ Tabla system_alerts creada
- ✅ Políticas RLS configuradas correctamente
- ✅ Datos de prueba insertados

PARA VERIFICAR QUE FUNCIONA:
- Ve al panel SaaS
- Deberías poder crear/editar tenants sin errores
- Los gráficos y métricas deberían funcionar
*/
