-- Script para verificar datos de eventos
-- =====================================================

-- Verificar si hay eventos en la base de datos
SELECT 
    'RESUMEN EVENTOS' as categoria,
    COUNT(*) as total_eventos,
    COUNT(CASE WHEN activo = true THEN 1 END) as eventos_activos,
    COUNT(CASE WHEN activo = false THEN 1 END) as eventos_inactivos
FROM eventos;

-- Mostrar todos los eventos con sus datos básicos
SELECT 
    'EVENTOS DISPONIBLES' as categoria,
    id,
    nombre,
    recinto,
    sala,
    activo,
    created_at,
    updated_at
FROM eventos
ORDER BY created_at DESC;

-- Verificar la estructura de la tabla eventos
SELECT 
    'ESTRUCTURA TABLA' as categoria,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'eventos'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar si hay recintos y salas disponibles
SELECT 
    'RECINTOS Y SALAS' as categoria,
    'recintos' as tabla,
    COUNT(*) as total
FROM recintos
UNION ALL
SELECT 
    'RECINTOS Y SALAS' as categoria,
    'salas' as tabla,
    COUNT(*) as total
FROM salas;

-- Mostrar algunos recintos y salas de ejemplo
SELECT 
    'EJEMPLOS RECINTOS' as categoria,
    id,
    nombre,
    direccion
FROM recintos
LIMIT 5;

SELECT 
    'EJEMPLOS SALAS' as categoria,
    id,
    nombre,
    recinto_id
FROM salas
LIMIT 5;

-- Verificar si hay eventos con recintos y salas válidos
SELECT 
    'EVENTOS CON RECINTOS VÁLIDOS' as categoria,
    e.id,
    e.nombre,
    e.recinto,
    r.nombre as nombre_recinto,
    e.sala,
    s.nombre as nombre_sala
FROM eventos e
LEFT JOIN recintos r ON e.recinto = r.id
LEFT JOIN salas s ON e.sala = s.id
ORDER BY e.created_at DESC; 