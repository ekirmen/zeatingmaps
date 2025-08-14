-- 🔧 SOLUCIÓN SIMPLE: PROBLEMA DE AISLAMIENTO DE TENANTS
-- Este script soluciona el problema donde los recintos desaparecen después de actualizar

-- ========================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- ========================================
SELECT '=== VERIFICANDO ESTADO ACTUAL ===' as info;

-- Verificar RLS en tablas críticas
SELECT 
    'Estado de RLS:' as info,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ HABILITADO'
        ELSE '❌ DESHABILITADO'
    END as estado
FROM pg_tables 
WHERE tablename IN ('recintos', 'salas', 'eventos', 'funciones')
ORDER BY tablename;

-- Verificar políticas existentes
SELECT 
    'Políticas existentes:' as info,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN polenabled = 't' THEN '✅ ACTIVA'
        ELSE '❌ INACTIVA'
    END as estado
FROM pg_policies 
WHERE tablename IN ('recintos', 'salas', 'eventos', 'funciones')
ORDER BY tablename, policyname;

-- ========================================
-- PASO 2: VERIFICAR TENANTS Y RECINTOS
-- ========================================
SELECT '=== VERIFICANDO TENANTS Y RECINTOS ===' as info;

-- Listar tenants activos
SELECT 
    'Tenants activos:' as info,
    id,
    subdomain,
    company_name,
    status
FROM tenants 
WHERE status = 'active'
ORDER BY subdomain;

-- Verificar recintos y sus tenant_id
SELECT 
    'Recintos y tenants:' as info,
    r.id,
    r.nombre,
    r.tenant_id,
    t.subdomain,
    t.company_name,
    CASE 
        WHEN r.tenant_id IS NULL THEN '❌ SIN TENANT_ID'
        WHEN r.tenant_id = t.id THEN '✅ TENANT_ID CORRECTO'
        ELSE '⚠️ TENANT_ID INCORRECTO'
    END as estado_tenant
FROM recintos r
LEFT JOIN tenants t ON r.tenant_id = t.id
ORDER BY r.id;

-- ========================================
-- PASO 3: CORREGIR TENANT_ID FALTANTE
-- ========================================
SELECT '=== CORRIGIENDO TENANT_ID FALTANTE ===' as info;

-- Obtener el primer tenant activo
DO $$
DECLARE
    default_tenant_id UUID;
    recintos_sin_tenant INTEGER;
BEGIN
    SELECT id INTO default_tenant_id 
    FROM tenants 
    WHERE status = 'active' 
    LIMIT 1;
    
    IF default_tenant_id IS NOT NULL THEN
        -- Contar recintos sin tenant_id
        SELECT COUNT(*) INTO recintos_sin_tenant
        FROM recintos 
        WHERE tenant_id IS NULL;
        
        IF recintos_sin_tenant > 0 THEN
            -- Actualizar recintos sin tenant_id
            UPDATE recintos 
            SET tenant_id = default_tenant_id 
            WHERE tenant_id IS NULL;
            
            RAISE NOTICE '✅ % recintos sin tenant_id actualizados con tenant: %', recintos_sin_tenant, default_tenant_id;
        ELSE
            RAISE NOTICE '✅ Todos los recintos ya tienen tenant_id';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ No se encontraron tenants activos';
    END IF;
END $$;

-- ========================================
-- PASO 4: HABILITAR RLS
-- ========================================
SELECT '=== HABILITANDO RLS ===' as info;

-- Habilitar RLS en todas las tablas críticas
ALTER TABLE recintos ENABLE ROW LEVEL SECURITY;
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE funciones ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PASO 5: CREAR POLÍTICAS RLS SIMPLES
-- ========================================
SELECT '=== CREANDO POLÍTICAS RLS ===' as info;

-- Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "Users can view own tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Users can manage own tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Users can view venues" ON recintos;
DROP POLICY IF EXISTS "Admins can manage venues" ON recintos;

-- Crear política simple para recintos
CREATE POLICY "Enable access for authenticated users" ON recintos
FOR ALL USING (
    auth.role() = 'authenticated' AND (
        -- Usuarios pueden acceder a recintos de su tenant
        tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
        OR
        -- O si no hay tenant configurado (desarrollo)
        tenant_id IS NULL
    )
);

-- ========================================
-- PASO 6: VERIFICAR RESULTADO
-- ========================================
SELECT '=== VERIFICANDO RESULTADO ===' as info;

-- Verificar políticas creadas
SELECT 
    'Políticas en recintos:' as info,
    policyname,
    cmd,
    CASE 
        WHEN polenabled = 't' THEN '✅ ACTIVA'
        ELSE '❌ INACTIVA'
    END as estado
FROM pg_policies 
WHERE tablename = 'recintos'
ORDER BY policyname;

-- Verificar estado final de recintos
SELECT 
    'Estado final de recintos:' as info,
    COUNT(*) as total_recintos,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as con_tenant_id,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as sin_tenant_id
FROM recintos;

-- ========================================
-- PASO 7: INSTRUCCIONES FINALES
-- ========================================
SELECT '=== INSTRUCCIONES FINALES ===' as info;

SELECT 
    'PASO 1:' as paso,
    'Verificar que las políticas estén activas arriba' as instruccion
UNION ALL
SELECT 
    'PASO 2:' as paso,
    'Recargar la página del backoffice' as instruccion
UNION ALL
SELECT 
    'PASO 3:' as paso,
    'Verificar que los recintos sean visibles' as instruccion
UNION ALL
SELECT 
    'PASO 4:' as paso,
    'Si persiste el problema, verificar el tenant_id del usuario autenticado' as instruccion;

-- ========================================
-- PASO 8: VERIFICACIÓN ADICIONAL
-- ========================================
SELECT '=== VERIFICACIÓN ADICIONAL ===' as info;

-- Verificar que el usuario autenticado tenga tenant_id
SELECT 
    'Para verificar usuario:' as info,
    'Ejecutar en SQL Editor:' as instruccion,
    'SELECT id, email, tenant_id FROM profiles WHERE id = auth.uid();' as consulta;
