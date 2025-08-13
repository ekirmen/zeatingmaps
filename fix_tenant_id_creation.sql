-- Script para verificar y corregir el problema de tenant_id faltante en recintos y salas
-- Este script identifica recintos y salas sin tenant_id y los actualiza

-- 1. VERIFICAR ESTADO ACTUAL
SELECT 'VERIFICANDO ESTADO ACTUAL' as mensaje;

-- Verificar recintos sin tenant_id
SELECT 
    'recintos_sin_tenant' as tabla,
    COUNT(*) as total
FROM recintos 
WHERE tenant_id IS NULL;

-- Verificar salas sin tenant_id
SELECT 
    'salas_sin_tenant' as tabla,
    COUNT(*) as total
FROM salas 
WHERE tenant_id IS NULL;

-- 2. MOSTRAR EJEMPLOS DE DATOS PROBLEMÁTICOS
-- Mostrar recintos sin tenant_id
SELECT 
    'recintos_sin_tenant' as tipo,
    id,
    nombre
FROM recintos 
WHERE tenant_id IS NULL
LIMIT 5;

-- Mostrar salas sin tenant_id
SELECT 
    'salas_sin_tenant' as tipo,
    id,
    nombre,
    recinto_id
FROM salas 
WHERE tenant_id IS NULL
LIMIT 5;

-- 3. VERIFICAR SI HAY USUARIOS CON TENANT_ID
SELECT 
    'usuarios_con_tenant' as tipo,
    COUNT(*) as total
FROM profiles 
WHERE tenant_id IS NOT NULL;

-- Mostrar algunos usuarios con tenant_id
SELECT 
    'ejemplos_usuarios_tenant' as tipo,
    id,
    login,
    tenant_id
FROM profiles 
WHERE tenant_id IS NOT NULL
LIMIT 5;

-- 4. CORREGIR RECINTOS SIN TENANT_ID
-- Asignar tenant_id basándose en el usuario que los creó (si es posible)
-- Primero, intentar asignar basándose en el primer usuario con tenant_id disponible
UPDATE recintos 
SET tenant_id = (
    SELECT p.tenant_id 
    FROM profiles p 
    WHERE p.tenant_id IS NOT NULL 
    LIMIT 1
)
WHERE tenant_id IS NULL;

-- 5. CORREGIR SALAS SIN TENANT_ID
-- Asignar tenant_id basándose en el recinto al que pertenecen
UPDATE salas 
SET tenant_id = (
    SELECT r.tenant_id 
    FROM recintos r 
    WHERE r.id = salas.recinto_id
)
WHERE tenant_id IS NULL 
AND recinto_id IS NOT NULL;

-- 6. VERIFICAR ESTADO DESPUÉS DE LA CORRECCIÓN
SELECT 'ESTADO DESPUÉS DE CORRECCIÓN' as mensaje;

-- Verificar recintos sin tenant_id después de la corrección
SELECT 
    'recintos_sin_tenant_despues' as tabla,
    COUNT(*) as total
FROM recintos 
WHERE tenant_id IS NULL;

-- Verificar salas sin tenant_id después de la corrección
SELECT 
    'salas_sin_tenant_despues' as tabla,
    COUNT(*) as total
FROM salas 
WHERE tenant_id IS NULL;

-- 7. MOSTRAR RECINTOS Y SALAS CORREGIDOS
-- Mostrar recintos con tenant_id
SELECT 
    'recintos_con_tenant' as tipo,
    id,
    nombre,
    tenant_id
FROM recintos 
WHERE tenant_id IS NOT NULL
ORDER BY id DESC
LIMIT 5;

-- Mostrar salas con tenant_id
SELECT 
    'salas_con_tenant' as tipo,
    id,
    nombre,
    recinto_id,
    tenant_id
FROM salas 
WHERE tenant_id IS NOT NULL
ORDER BY id DESC
LIMIT 5;

-- 8. VERIFICAR INTEGRIDAD REFERENCIAL
-- Verificar que todas las salas tengan recinto_id válido
SELECT 
    'salas_sin_recinto_valido' as problema,
    COUNT(*) as total
FROM salas s
LEFT JOIN recintos r ON s.recinto_id = r.id
WHERE r.id IS NULL;

-- Verificar que todos los recintos tengan tenant_id válido
SELECT 
    'recintos_sin_tenant_valido' as problema,
    COUNT(*) as total
FROM recintos r
LEFT JOIN tenants t ON r.tenant_id = t.id
WHERE t.id IS NULL;

-- 9. RECOMENDACIONES PARA EL CÓDIGO
SELECT 'RECOMENDACIONES PARA EL CÓDIGO' as mensaje;
SELECT '1. Modificar CreateRecintoForm para incluir tenant_id del usuario autenticado' as recomendacion;
SELECT '2. Modificar AddSalaForm para incluir tenant_id del recinto padre' as recomendacion;
SELECT '3. Usar RLS para asegurar que solo se puedan crear registros con tenant_id válido' as recomendacion;
SELECT '4. Implementar validación en el frontend antes de enviar datos' as recomendacion;

SELECT 'CORRECCIÓN COMPLETADA' as mensaje;
