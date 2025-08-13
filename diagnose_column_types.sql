-- Script para diagnosticar tipos de datos en las columnas relacionadas con zonas y salas
-- Este script ayudará a identificar por qué hay un error de tipo text = integer

-- 1. Verificar tipos de datos de la tabla zonas
SELECT 
    'zonas' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'zonas' 
AND column_name IN ('id', 'sala_id', 'tenant_id')
ORDER BY ordinal_position;

-- 2. Verificar tipos de datos de la tabla salas
SELECT 
    'salas' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'salas' 
AND column_name IN ('id', 'recinto_id', 'tenant_id')
ORDER BY ordinal_position;

-- 3. Verificar tipos de datos de la tabla recintos
SELECT 
    'recintos' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recintos' 
AND column_name IN ('id', 'tenant_id')
ORDER BY ordinal_position;

-- 4. Verificar si hay inconsistencias en los datos
-- Mostrar algunos ejemplos de zonas con sus sala_id
SELECT 
    'zonas' as tabla,
    id,
    sala_id,
    pg_typeof(sala_id) as tipo_sala_id
FROM zonas 
LIMIT 5;

-- 5. Verificar si hay inconsistencias en los datos
-- Mostrar algunos ejemplos de salas con sus id
SELECT 
    'salas' as tabla,
    id,
    pg_typeof(id) as tipo_id
FROM salas 
LIMIT 5;

-- 6. Verificar si hay inconsistencias en los datos
-- Mostrar algunos ejemplos de recintos con sus id
SELECT 
    'recintos' as tabla,
    id,
    pg_typeof(id) as tipo_id
FROM recintos 
LIMIT 5;

-- 7. Verificar si hay datos que puedan causar problemas
-- Buscar zonas con sala_id que no sean UUID válidos
SELECT 
    'zonas_con_sala_id_invalido' as problema,
    COUNT(*) as total
FROM zonas 
WHERE sala_id IS NOT NULL 
AND pg_typeof(sala_id) != 'uuid'::regtype;

-- 8. Verificar si hay datos que puedan causar problemas
-- Buscar salas con id que no sean UUID válidos
SELECT 
    'salas_con_id_invalido' as problema,
    COUNT(*) as total
FROM salas 
WHERE pg_typeof(id) != 'uuid'::regtype;

-- 9. Verificar si hay datos que puedan causar problemas
-- Buscar recintos con id que no sean UUID válidos
SELECT 
    'recintos_con_id_invalido' as problema,
    COUNT(*) as total
FROM recintos 
WHERE pg_typeof(id) != 'uuid'::regtype;
