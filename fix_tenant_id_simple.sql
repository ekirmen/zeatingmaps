-- Script simple para corregir tenant_id faltante en recintos y salas
-- Este script es más directo y evita columnas que pueden no existir

-- 1. VERIFICAR ESTADO ACTUAL
SELECT 'ESTADO ACTUAL' as mensaje;

-- Contar recintos sin tenant_id
SELECT 
    'recintos_sin_tenant' as problema,
    COUNT(*) as total
FROM recintos 
WHERE tenant_id IS NULL;

-- Contar salas sin tenant_id
SELECT 
    'salas_sin_tenant' as problema,
    COUNT(*) as total
FROM salas 
WHERE tenant_id IS NULL;

-- 2. VERIFICAR SI HAY USUARIOS CON TENANT_ID
SELECT 
    'usuarios_con_tenant' as tipo,
    COUNT(*) as total
FROM profiles 
WHERE tenant_id IS NOT NULL;

-- 3. CORREGIR RECINTOS SIN TENANT_ID
-- Asignar tenant_id del primer usuario disponible
UPDATE recintos 
SET tenant_id = (
    SELECT p.tenant_id 
    FROM profiles p 
    WHERE p.tenant_id IS NOT NULL 
    LIMIT 1
)
WHERE tenant_id IS NULL;

-- 4. CORREGIR SALAS SIN TENANT_ID
-- Asignar tenant_id basándose en el recinto al que pertenecen
UPDATE salas 
SET tenant_id = (
    SELECT r.tenant_id 
    FROM recintos r 
    WHERE r.id = salas.recinto_id
)
WHERE tenant_id IS NULL 
AND recinto_id IS NOT NULL;

-- 5. VERIFICAR RESULTADO
SELECT 'ESTADO DESPUÉS DE CORRECCIÓN' as mensaje;

-- Verificar recintos sin tenant_id después de la corrección
SELECT 
    'recintos_sin_tenant_despues' as problema,
    COUNT(*) as total
FROM recintos 
WHERE tenant_id IS NULL;

-- Verificar salas sin tenant_id después de la corrección
SELECT 
    'salas_sin_tenant_despues' as problema,
    COUNT(*) as total
FROM salas 
WHERE tenant_id IS NULL;

-- 6. MOSTRAR ALGUNOS EJEMPLOS CORREGIDOS
-- Mostrar algunos recintos con tenant_id
SELECT 
    'recintos_corregidos' as tipo,
    id,
    nombre,
    tenant_id
FROM recintos 
WHERE tenant_id IS NOT NULL
ORDER BY id DESC
LIMIT 3;

-- Mostrar algunas salas con tenant_id
SELECT 
    'salas_corregidas' as tipo,
    id,
    nombre,
    recinto_id,
    tenant_id
FROM salas 
WHERE tenant_id IS NOT NULL
ORDER BY id DESC
LIMIT 3;

SELECT 'CORRECCIÓN COMPLETADA' as mensaje;
