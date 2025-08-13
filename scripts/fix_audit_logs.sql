-- 🚀 Script para diagnosticar y arreglar la tabla audit_logs
-- Este script resuelve el error 400 (Bad Request) en audit_logs

-- =====================================================
-- PASO 1: VERIFICAR ESTRUCTURA DE AUDIT_LOGS
-- =====================================================

-- Verificar si la tabla audit_logs existe
SELECT 
    'ESTRUCTURA AUDIT_LOGS' as tipo,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'audit_logs';

-- Mostrar la estructura actual de la tabla audit_logs
SELECT 
    'COLUMNAS AUDIT_LOGS' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

-- =====================================================
-- PASO 2: VERIFICAR POLÍTICAS RLS
-- =====================================================

-- Verificar si RLS está habilitado
SELECT 
    'RLS STATUS' as tipo,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'audit_logs';

-- Verificar políticas existentes
SELECT 
    'POLÍTICAS RLS' as tipo,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'audit_logs';

-- =====================================================
-- PASO 3: CREAR TABLA AUDIT_LOGS SI NO EXISTE
-- =====================================================

-- Crear tabla audit_logs si no existe
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

-- =====================================================
-- PASO 4: AGREGAR COLUMNAS FALTANTES
-- =====================================================

-- Agregar columnas que puedan estar faltando
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_type TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- =====================================================
-- PASO 5: CREAR ÍNDICES
-- =====================================================

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- PASO 6: HABILITAR RLS
-- =====================================================

-- Habilitar RLS en la tabla audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 7: CREAR POLÍTICAS RLS
-- =====================================================

-- Eliminar políticas existentes para recrearlas limpiamente
DROP POLICY IF EXISTS "Users can view own tenant audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert own tenant audit logs" ON audit_logs;

-- Política: Usuarios pueden ver logs de auditoría de su tenant
CREATE POLICY "Users can view own tenant audit logs" ON audit_logs
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- Política: Usuarios pueden insertar logs de auditoría en su tenant
CREATE POLICY "Users can insert own tenant audit logs" ON audit_logs
FOR INSERT WITH CHECK (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- Política: Usuarios pueden actualizar logs de auditoría de su tenant
CREATE POLICY "Users can update own tenant audit logs" ON audit_logs
FOR UPDATE USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
) WITH CHECK (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- =====================================================
-- PASO 8: VERIFICAR QUE TODO FUNCIONA
-- =====================================================

-- Verificar estructura final
SELECT 
    'ESTRUCTURA FINAL' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

-- Verificar políticas finales
SELECT 
    'POLÍTICAS FINALES' as tipo,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'audit_logs';

-- =====================================================
-- PASO 9: INSERTAR DATO DE PRUEBA
-- =====================================================

-- Insertar un log de auditoría de prueba
DO $$
DECLARE
    first_tenant_id UUID;
    first_user_id UUID;
BEGIN
    -- Obtener el primer tenant disponible
    SELECT id INTO first_tenant_id FROM tenants LIMIT 1;
    
    -- Obtener el primer usuario disponible
    SELECT id INTO first_user_id FROM profiles LIMIT 1;
    
    -- Solo insertar si hay datos disponibles
    IF first_tenant_id IS NOT NULL THEN
        INSERT INTO audit_logs (tenant_id, user_id, action, details, severity, resource_type) VALUES
            (first_tenant_id, first_user_id, 'test_insert', 'Log de prueba para verificar funcionamiento', 'info', 'test')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Log de auditoría de prueba insertado correctamente';
    ELSE
        RAISE NOTICE '⚠️ No hay tenants disponibles para insertar log de prueba';
    END IF;
END $$;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Tabla audit_logs diagnosticada y arreglada exitosamente';
    RAISE NOTICE '✅ Estructura verificada y columnas agregadas';
    RAISE NOTICE '🔒 RLS habilitado con políticas correctas';
    RAISE NOTICE '📋 Ahora deberías poder insertar logs de auditoría sin errores 400';
END $$;
