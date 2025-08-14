-- 🔍 DIAGNÓSTICO COMPLETO: PROBLEMA DE AISLAMIENTO DE TENANTS
-- Este script diagnostica por qué los recintos desaparecen después de actualizar

-- ========================================
-- PASO 1: VERIFICAR ESTADO DE RLS
-- ========================================
SELECT '=== VERIFICANDO ESTADO DE RLS ===' as info;

-- Estado actual de RLS en tablas críticas
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
-- PASO 2: VERIFICAR POLÍTICAS ACTIVAS
-- ========================================
SELECT '=== VERIFICANDO POLÍTICAS ACTIVAS ===' as info;

-- Políticas en recintos
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

-- ========================================
-- PASO 3: VERIFICAR DATOS DE TENANTS
-- ========================================
SELECT '=== VERIFICANDO DATOS DE TENANTS ===' as info;

-- Listar todos los tenants activos
SELECT 
    'Tenants activos:' as info,
    id,
    subdomain,
    domain,
    full_url,
    company_name,
    status
FROM tenants 
WHERE status = 'active'
ORDER BY subdomain;

-- ========================================
-- PASO 4: VERIFICAR RECINTOS Y SUS TENANTS
-- ========================================
SELECT '=== VERIFICANDO RECINTOS Y TENANTS ===' as info;

-- Recintos con información de tenant
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
-- PASO 5: VERIFICAR PERFILES DE USUARIOS
-- ========================================
SELECT '=== VERIFICANDO PERFILES DE USUARIOS ===' as info;

-- Usuarios con información de tenant
SELECT 
    'Usuarios y tenants:' as info,
    p.id,
    p.email,
    p.tenant_id,
    t.subdomain,
    t.company_name,
    CASE 
        WHEN p.tenant_id IS NULL THEN '❌ SIN TENANT_ID'
        WHEN p.tenant_id = t.id THEN '✅ TENANT_ID CORRECTO'
        ELSE '⚠️ TENANT_ID INCORRECTO'
    END as estado_tenant
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
ORDER BY p.id
LIMIT 10;

-- ========================================
-- PASO 6: VERIFICAR POLÍTICAS RLS DETALLADAS
-- ========================================
SELECT '=== VERIFICANDO POLÍTICAS RLS DETALLADAS ===' as info;

-- Políticas de recintos con su definición SQL
SELECT 
    'Política de recintos:' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'recintos'
ORDER BY policyname;

-- ========================================
-- PASO 7: SIMULAR CONSULTA CON USUARIO ESPECÍFICO
-- ========================================
SELECT '=== SIMULANDO CONSULTA CON USUARIO ===' as info;

-- Simular consulta como si fuera un usuario específico
-- Reemplaza 'USER_ID_AQUI' con un ID de usuario real de tu sistema
SELECT 
    'Simulación de consulta:' as info,
    'Para probar, ejecuta manualmente:' as instruccion,
    'SELECT * FROM recintos WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = ''USER_ID_AQUI'');' as consulta_ejemplo;

-- ========================================
-- PASO 8: INSTRUCCIONES DE SOLUCIÓN
-- ========================================
SELECT '=== INSTRUCCIONES DE SOLUCIÓN ===' as info;

SELECT 
    'PASO 1:' as paso,
    'Verificar que RLS esté habilitado en recintos' as instruccion
UNION ALL
SELECT 
    'PASO 2:' as paso,
    'Verificar que las políticas estén activas' as instruccion
UNION ALL
SELECT 
    'PASO 3:' as paso,
    'Verificar que todos los recintos tengan tenant_id válido' as instruccion
UNION ALL
SELECT 
    'PASO 4:' as paso,
    'Verificar que el usuario autenticado tenga tenant_id en su perfil' as instruccion
UNION ALL
SELECT 
    'PASO 5:' as paso,
    'Verificar que el frontend esté pasando el tenant_id en las consultas' as instruccion;

-- ========================================
-- PASO 9: VERIFICAR PROBLEMAS COMUNES
-- ========================================
SELECT '=== VERIFICANDO PROBLEMAS COMUNES ===' as info;

-- Recintos sin tenant_id
SELECT 
    'Recintos sin tenant_id:' as info,
    COUNT(*) as total
FROM recintos 
WHERE tenant_id IS NULL;

-- Usuarios sin tenant_id
SELECT 
    'Usuarios sin tenant_id:' as info,
    COUNT(*) as total
FROM profiles 
WHERE tenant_id IS NULL;

-- Políticas deshabilitadas
SELECT 
    'Políticas deshabilitadas:' as info,
    COUNT(*) as total
FROM pg_policies 
WHERE polenabled = 'f' AND tablename = 'recintos';
