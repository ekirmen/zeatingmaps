-- Script para crear el tenant faltante o corregir la referencia
-- Este script resuelve el error: Key (tenant_id)=(2b86dc35-49ad-43ea-a50d-a14c55a327cc) is not present in table "tenants"

-- 1. VERIFICAR EL TENANT_ID PROBLEMÁTICO
SELECT 'VERIFICANDO TENANT_ID PROBLEMÁTICO' as mensaje;

-- Buscar el tenant_id específico que está causando el error
SELECT 
    'tenant_id_problematico' as tipo,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id_buscado,
    CASE 
        WHEN EXISTS (SELECT 1 FROM tenants WHERE id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc') 
        THEN '✅ EXISTE en tenants'
        ELSE '❌ NO EXISTE en tenants'
    END as estado;

-- 2. VERIFICAR SI HAY USUARIOS CON ESTE TENANT_ID
SELECT 
    'usuarios_con_tenant_problematico' as tipo,
    COUNT(*) as total
FROM profiles 
WHERE tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc';

-- Mostrar usuarios con este tenant_id
SELECT 
    'usuarios_afectados' as tipo,
    id,
    login,
    tenant_id
FROM profiles 
WHERE tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc';

-- 3. OPCIONES DE SOLUCIÓN

-- Opción A: Crear el tenant faltante
-- Descomentar y ejecutar si quieres crear el tenant
/*
INSERT INTO tenants (
    id, 
    subdomain, 
    company_name, 
    contact_email, 
    status, 
    created_at, 
    updated_at
) VALUES (
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc',
    'tenant-faltante',
    'Tenant Faltante',
    'admin@tenant-faltante.com',
    'active',
    NOW(),
    NOW()
);
*/

-- Opción B: Corregir la referencia del usuario (RECOMENDADO)
-- Asignar el primer tenant válido disponible
UPDATE profiles 
SET tenant_id = (
    SELECT id FROM tenants LIMIT 1
)
WHERE tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc';

-- 4. VERIFICAR ESTADO DESPUÉS DE LA CORRECCIÓN
SELECT 'ESTADO DESPUÉS DE CORRECCIÓN' as mensaje;

-- Verificar que el usuario ya no tenga el tenant_id problemático
SELECT 
    'verificacion_usuario_corregido' as tipo,
    COUNT(*) as total
FROM profiles 
WHERE tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc';

-- Mostrar el usuario corregido
SELECT 
    'usuario_corregido' as tipo,
    p.id,
    p.login,
    p.tenant_id,
    t.company_name as nombre_tenant
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE p.id IN (
    SELECT id FROM profiles 
    WHERE tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
);

-- 5. VERIFICAR INTEGRIDAD REFERENCIAL
SELECT 
    'verificacion_integridad_final' as tipo,
    'profiles.tenant_id -> tenants.id' as relacion,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK - No hay problemas de integridad'
        ELSE '❌ PROBLEMA - Hay referencias inválidas'
    END as estado
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE p.tenant_id IS NOT NULL 
AND t.id IS NULL;

-- 6. RECOMENDACIONES
SELECT 'RECOMENDACIONES' as mensaje;
SELECT '1. Se recomienda usar la Opción B (corregir referencia) en lugar de crear un tenant fantasma' as recomendacion;
SELECT '2. Verificar que todos los usuarios tengan tenant_id válidos antes de crear recintos/salas' as recomendacion;
SELECT '3. Implementar validación en el frontend para asegurar tenant_id válido' as recomendacion;
SELECT '4. Considerar implementar RLS para mayor seguridad' as recomendacion;

SELECT 'CORRECCIÓN COMPLETADA' as mensaje;
