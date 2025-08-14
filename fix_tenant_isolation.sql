-- 🔒 SOLUCIÓN COMPLETA: HABILITAR RLS EN TABLAS CRÍTICAS
-- Este script habilita RLS para que las políticas existentes funcionen

-- ========================================
-- PASO 1: HABILITAR RLS EN TABLAS CRÍTICAS
-- ========================================
SELECT '=== HABILITANDO RLS EN TABLAS CRÍTICAS ===' as info;

-- Habilitar RLS en recintos
ALTER TABLE recintos ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en salas
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en eventos
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en funciones
ALTER TABLE funciones ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PASO 2: VERIFICAR QUE RLS ESTÉ HABILITADO
-- ========================================
SELECT '=== VERIFICANDO RLS HABILITADO ===' as info;

-- Estado actual de RLS
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

-- ========================================
-- PASO 3: VERIFICAR POLÍTICAS EXISTENTES
-- ========================================
SELECT '=== VERIFICANDO POLÍTICAS EXISTENTES ===' as info;

-- Políticas en recintos
SELECT 
    'Políticas en recintos:' as info,
    policyname,
    cmd,
    '✅ ACTIVA' as estado
FROM pg_policies 
WHERE tablename = 'recintos'
ORDER BY policyname;

-- Políticas en salas
SELECT 
    'Políticas en salas:' as info,
    policyname,
    cmd,
    '✅ ACTIVA' as estado
FROM pg_policies 
WHERE tablename = 'salas'
ORDER BY policyname;

-- Políticas en eventos
SELECT 
    'Políticas en eventos:' as info,
    policyname,
    cmd,
    '✅ ACTIVA' as estado
FROM pg_policies 
WHERE tablename = 'eventos'
ORDER BY policyname;

-- Políticas en funciones
SELECT 
    'Políticas en funciones:' as info,
    policyname,
    cmd,
    '✅ ACTIVA' as estado
FROM pg_policies 
WHERE tablename = 'funciones'
ORDER BY policyname;

-- ========================================
-- PASO 4: VERIFICAR AISLAMIENTO
-- ========================================
SELECT '=== VERIFICANDO AISLAMIENTO ===' as info;

-- Recintos por tenant
SELECT 
    'Recintos por tenant:' as info,
    t.subdomain,
    t.company_name,
    COUNT(r.id) as total_recintos
FROM tenants t
LEFT JOIN recintos r ON t.id = r.tenant_id
GROUP BY t.id, t.subdomain, t.company_name
ORDER BY t.subdomain;

-- Salas por tenant
SELECT 
    'Salas por tenant:' as info,
    t.subdomain,
    t.company_name,
    COUNT(s.id) as total_salas
FROM tenants t
LEFT JOIN salas s ON t.id = s.tenant_id
GROUP BY t.id, t.subdomain, t.company_name
ORDER BY t.subdomain;

-- Eventos por tenant
SELECT 
    'Eventos por tenant:' as info,
    t.subdomain,
    t.company_name,
    COUNT(e.id) as total_eventos
FROM tenants t
LEFT JOIN eventos e ON t.id = e.tenant_id
GROUP BY t.id, t.subdomain, t.company_name
ORDER BY t.subdomain;

-- Funciones por tenant
SELECT 
    'Funciones por tenant:' as info,
    t.subdomain,
    t.company_name,
    COUNT(func.id) as total_funciones
FROM tenants t
LEFT JOIN funciones func ON t.id = func.tenant_id
GROUP BY t.id, t.subdomain, t.company_name
ORDER BY t.subdomain;

-- ========================================
-- PASO 5: INSTRUCCIONES DE VERIFICACIÓN
-- ========================================
SELECT '=== INSTRUCCIONES DE VERIFICACIÓN ===' as info;

SELECT 
    ' PASOS PARA VERIFICAR:' as paso,
    '1. RLS debe estar habilitado en las 4 tablas críticas' as instruccion
UNION ALL
SELECT 
    '2. Verificar políticas:' as paso,
    'Todas las políticas existentes deben estar activas' as instruccion
UNION ALL
SELECT 
    '3. Probar aislamiento:' as paso,
    'Cada tenant debe ver solo su contenido' as instruccion
UNION ALL
SELECT 
    '4. Si hay problemas:' as paso,
    'Verificar que app.tenant_id esté configurado en el frontend' as instruccion;
