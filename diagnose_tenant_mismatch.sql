-- Script para diagnosticar el problema de tenant_id que no existe en la tabla tenants
-- Este script identifica usuarios con tenant_id inválidos y los corrige

-- 1. VERIFICAR ESTADO ACTUAL
SELECT 'VERIFICANDO ESTADO ACTUAL' as mensaje;

-- Verificar si hay usuarios con tenant_id que no existe en tenants
SELECT 
    'usuarios_con_tenant_invalido' as problema,
    COUNT(*) as total
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE p.tenant_id IS NOT NULL 
AND t.id IS NULL;

-- 2. MOSTRAR USUARIOS CON TENANT_ID INVÁLIDO
SELECT 
    'usuarios_con_tenant_invalido' as tipo,
    p.id,
    p.login,
    p.tenant_id,
    'TENANT NO EXISTE' as estado
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE p.tenant_id IS NOT NULL 
AND t.id IS NULL
LIMIT 10;

-- 3. VERIFICAR SI HAY TENANTS VÁLIDOS
SELECT 
    'tenants_validos' as tipo,
    COUNT(*) as total
FROM tenants;

-- Mostrar algunos tenants válidos
SELECT 
    'ejemplos_tenants_validos' as tipo,
    id,
    subdomain,
    company_name
FROM tenants
LIMIT 5;

-- 4. VERIFICAR USUARIOS SIN TENANT_ID
SELECT 
    'usuarios_sin_tenant' as tipo,
    COUNT(*) as total
FROM profiles 
WHERE tenant_id IS NULL;

-- Mostrar algunos usuarios sin tenant_id
SELECT 
    'ejemplos_usuarios_sin_tenant' as tipo,
    id,
    login
FROM profiles 
WHERE tenant_id IS NULL
LIMIT 5;

-- 5. CORREGIR USUARIOS CON TENANT_ID INVÁLIDO
-- Opción 1: Asignar el primer tenant válido disponible
UPDATE profiles 
SET tenant_id = (
    SELECT id FROM tenants LIMIT 1
)
WHERE tenant_id IN (
    SELECT p.tenant_id 
    FROM profiles p
    LEFT JOIN tenants t ON p.tenant_id = t.id
    WHERE p.tenant_id IS NOT NULL 
    AND t.id IS NULL
);

-- 6. VERIFICAR ESTADO DESPUÉS DE LA CORRECCIÓN
SELECT 'ESTADO DESPUÉS DE CORRECCIÓN' as mensaje;

-- Verificar si quedan usuarios con tenant_id inválido
SELECT 
    'usuarios_con_tenant_invalido_despues' as problema,
    COUNT(*) as total
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE p.tenant_id IS NOT NULL 
AND t.id IS NULL;

-- 7. MOSTRAR USUARIOS CORREGIDOS
SELECT 
    'usuarios_corregidos' as tipo,
    p.id,
    p.login,
    p.tenant_id,
    t.company_name as nombre_tenant
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE p.tenant_id IS NOT NULL
ORDER BY p.id DESC
LIMIT 5;

-- 8. VERIFICAR QUE NO HAYA PROBLEMAS DE INTEGRIDAD REFERENCIAL
SELECT 
    'verificacion_integridad' as tipo,
    'profiles.tenant_id -> tenants.id' as relacion,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK - No hay problemas de integridad'
        ELSE '❌ PROBLEMA - Hay referencias inválidas'
    END as estado
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE p.tenant_id IS NOT NULL 
AND t.id IS NULL;

SELECT 'DIAGNÓSTICO COMPLETADO' as mensaje;
