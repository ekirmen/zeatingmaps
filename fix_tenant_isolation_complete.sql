-- 🔧 SOLUCIÓN COMPLETA: PROBLEMA DE AISLAMIENTO DE TENANTS
-- Este script soluciona el problema donde los recintos desaparecen después de actualizar

-- ========================================
-- PASO 1: VERIFICAR Y CORREGIR TENANT_ID EN RECINTOS
-- ========================================
SELECT '=== CORRIGIENDO TENANT_ID EN RECINTOS ===' as info;

-- Verificar recintos sin tenant_id
SELECT 
    'Recintos sin tenant_id:' as info,
    COUNT(*) as total
FROM recintos 
WHERE tenant_id IS NULL;

-- Si hay recintos sin tenant_id, asignar uno por defecto
-- Primero, obtener el primer tenant activo
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id 
    FROM tenants 
    WHERE status = 'active' 
    LIMIT 1;
    
    IF default_tenant_id IS NOT NULL THEN
        -- Actualizar recintos sin tenant_id
        UPDATE recintos 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL;
        
        RAISE NOTICE '✅ Recintos sin tenant_id actualizados con tenant: %', default_tenant_id;
    ELSE
        RAISE NOTICE '⚠️ No se encontraron tenants activos';
    END IF;
END $$;

-- ========================================
-- PASO 2: VERIFICAR Y CORREGIR TENANT_ID EN SALAS
-- ========================================
SELECT '=== CORRIGIENDO TENANT_ID EN SALAS ===' as info;

-- Verificar salas sin tenant_id
SELECT 
    'Salas sin tenant_id:' as info,
    COUNT(*) as total
FROM salas 
WHERE tenant_id IS NULL;

-- Asignar tenant_id a salas basándose en su recinto
UPDATE salas 
SET tenant_id = recintos.tenant_id
FROM recintos 
WHERE salas.recinto_id = recintos.id 
AND salas.tenant_id IS NULL;

-- ========================================
-- PASO 3: VERIFICAR Y CORREGIR TENANT_ID EN EVENTOS
-- ========================================
SELECT '=== CORRIGIENDO TENANT_ID EN EVENTOS ===' as info;

-- Verificar eventos sin tenant_id
SELECT 
    'Eventos sin tenant_id:' as info,
    COUNT(*) as total
FROM eventos 
WHERE tenant_id IS NULL;

-- Asignar tenant_id a eventos basándose en su recinto
UPDATE eventos 
SET tenant_id = recintos.tenant_id
FROM recintos 
WHERE eventos.recinto_id = recintos.id 
AND eventos.tenant_id IS NULL;

-- ========================================
-- PASO 4: VERIFICAR Y CORREGIR TENANT_ID EN FUNCIONES
-- ========================================
SELECT '=== CORRIGIENDO TENANT_ID EN FUNCIONES ===' as info;

-- Verificar funciones sin tenant_id
SELECT 
    'Funciones sin tenant_id:' as info,
    COUNT(*) as total
FROM funciones 
WHERE tenant_id IS NULL;

-- Asignar tenant_id a funciones basándose en su evento
UPDATE funciones 
SET tenant_id = eventos.tenant_id
FROM eventos 
WHERE funciones.evento_id = eventos.id 
AND funciones.tenant_id IS NULL;

-- ========================================
-- PASO 5: VERIFICAR POLÍTICAS RLS
-- ========================================
SELECT '=== VERIFICANDO POLÍTICAS RLS ===' as info;

-- Habilitar RLS en todas las tablas críticas
ALTER TABLE recintos ENABLE ROW LEVEL SECURITY;
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE funciones ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PASO 6: CREAR POLÍTICAS RLS CORRECTAS
-- ========================================
SELECT '=== CREANDO POLÍTICAS RLS CORRECTAS ===' as info;

-- Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Users can view own tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Users can manage own tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Users can view venues" ON recintos;
DROP POLICY IF EXISTS "Admins can manage venues" ON recintos;

-- Crear políticas simples y efectivas para recintos
CREATE POLICY "Enable read access for authenticated users" ON recintos
FOR SELECT USING (
    auth.role() = 'authenticated' AND (
        -- Usuarios pueden ver recintos de su tenant
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

CREATE POLICY "Enable insert for authenticated users" ON recintos
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
        -- Usuarios pueden insertar recintos en su tenant
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

CREATE POLICY "Enable update for authenticated users" ON recintos
FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
        -- Usuarios pueden actualizar recintos de su tenant
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

CREATE POLICY "Enable delete for authenticated users" ON recintos
FOR DELETE USING (
    auth.role() = 'authenticated' AND (
        -- Usuarios pueden eliminar recintos de su tenant
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
-- PASO 7: VERIFICAR QUE LAS POLÍTICAS ESTÉN ACTIVAS
-- ========================================
SELECT '=== VERIFICANDO POLÍTICAS ACTIVAS ===' as info;

-- Verificar políticas creadas
SELECT 
    'Políticas en recintos:' as info,
    policyname,
    cmd,
    CASE 
        WHEN enabled = 't' THEN '✅ ACTIVA'
        ELSE '❌ INACTIVA'
    END as estado
FROM pg_policies 
WHERE tablename = 'recintos'
ORDER BY policyname;

-- ========================================
-- PASO 8: VERIFICAR AISLAMIENTO
-- ========================================
SELECT '=== VERIFICANDO AISLAMIENTO ===' as info;

-- Recintos por tenant después de la corrección
SELECT 
    'Recintos por tenant:' as info,
    t.subdomain,
    t.company_name,
    COUNT(r.id) as total_recintos
FROM tenants t
LEFT JOIN recintos r ON t.id = r.tenant_id
GROUP BY t.id, t.subdomain, t.company_name
ORDER BY t.subdomain;

-- ========================================
-- PASO 9: INSTRUCCIONES DE VERIFICACIÓN
-- ========================================
SELECT '=== INSTRUCCIONES DE VERIFICACIÓN ===' as info;

SELECT 
    'PASO 1:' as paso,
    'Ejecutar este script en Supabase SQL Editor' as instruccion
UNION ALL
SELECT 
    'PASO 2:' as paso,
    'Verificar que las políticas estén activas' as instruccion
UNION ALL
SELECT 
    'PASO 3:' as paso,
    'Recargar la página del backoffice' as instruccion
UNION ALL
SELECT 
    'PASO 4:' as paso,
    'Verificar que los recintos sean visibles' as instruccion
UNION ALL
SELECT 
    'PASO 5:' as paso,
    'Si persiste el problema, verificar el tenant_id del usuario autenticado' as instruccion;

-- ========================================
-- PASO 10: VERIFICACIÓN FINAL
-- ========================================
SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Estado final de las tablas
SELECT 
    'Estado final:' as info,
    'recintos' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as con_tenant_id,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as sin_tenant_id
FROM recintos
UNION ALL
SELECT 
    'Estado final:' as info,
    'salas' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as con_tenant_id,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as sin_tenant_id
FROM salas
UNION ALL
SELECT 
    'Estado final:' as info,
    'eventos' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as con_tenant_id,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as sin_tenant_id
FROM eventos
UNION ALL
SELECT 
    'Estado final:' as info,
    'funciones' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as con_tenant_id,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as sin_tenant_id
FROM funciones;
