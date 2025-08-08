-- 🎯 Crear Mapas con Estructura Existente
-- Este script crea mapas usando la estructura existente de la tabla

-- =====================================================
-- VERIFICAR ESTRUCTURA EXISTENTE
-- =====================================================

-- Mostrar estructura actual de mapas
SELECT 
    'ESTRUCTURA MAPAS' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'mapas'
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR SALAS EXISTENTES
-- =====================================================

-- Mostrar salas del tenant
SELECT 
    'SALAS EXISTENTES' as tipo,
    s.id,
    s.nombre,
    s.capacidad,
    s.recinto_id,
    r.nombre as recinto_nombre
FROM salas s
LEFT JOIN recintos r ON s.recinto_id = r.id
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY s.nombre;

-- =====================================================
-- CREAR MAPA PARA SALA PRINCIPAL
-- =====================================================

-- Crear mapa para Sala Principal si no existe
INSERT INTO mapas (
    sala_id,
    tenant_id,
    contenido
)
SELECT 
    s.id as sala_id,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id,
    '{
        "tipo": "teatro",
        "nombre": "Mapa Sala Principal",
        "filas": 10,
        "asientos_por_fila": 15,
        "zonas": [
            {
                "nombre": "Zona VIP",
                "color": "#FFD700",
                "precio": 150.00,
                "filas": [1, 2, 3],
                "asientos": "todos"
            },
            {
                "nombre": "Zona General",
                "color": "#4CAF50",
                "precio": 75.00,
                "filas": [4, 5, 6, 7],
                "asientos": "todos"
            },
            {
                "nombre": "Zona Económica",
                "color": "#2196F3",
                "precio": 45.00,
                "filas": [8, 9, 10],
                "asientos": "todos"
            }
        ]
    }'::jsonb as contenido
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND s.nombre = 'Sala Principal'
AND NOT EXISTS (
    SELECT 1 FROM mapas m 
    WHERE m.sala_id = s.id
);

-- =====================================================
-- CREAR MAPA PARA SALA VIP
-- =====================================================

-- Crear mapa para Sala VIP si no existe
INSERT INTO mapas (
    sala_id,
    tenant_id,
    contenido
)
SELECT 
    s.id as sala_id,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id,
    '{
        "tipo": "teatro",
        "nombre": "Mapa Sala VIP",
        "filas": 8,
        "asientos_por_fila": 12,
        "zonas": [
            {
                "nombre": "Zona VIP Premium",
                "color": "#FFD700",
                "precio": 200.00,
                "filas": [1, 2, 3, 4],
                "asientos": "todos"
            },
            {
                "nombre": "Zona VIP Estándar",
                "color": "#FFA500",
                "precio": 150.00,
                "filas": [5, 6, 7, 8],
                "asientos": "todos"
            }
        ]
    }'::jsonb as contenido
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND s.nombre = 'Sala VIP'
AND NOT EXISTS (
    SELECT 1 FROM mapas m 
    WHERE m.sala_id = s.id
);

-- =====================================================
-- VERIFICAR MAPAS CREADOS
-- =====================================================

-- Mostrar mapas creados
SELECT 
    'MAPAS CREADOS' as tipo,
    m.id,
    m.sala_id,
    s.nombre as sala_nombre,
    m.contenido->>'nombre' as nombre_mapa,
    m.contenido->>'tipo' as tipo_mapa,
    m.contenido->>'filas' as filas,
    m.contenido->>'asientos_por_fila' as asientos_por_fila
FROM mapas m
JOIN salas s ON m.sala_id = s.id
WHERE m.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY s.nombre;

-- =====================================================
-- VERIFICAR ZONAS EN MAPAS
-- =====================================================

-- Mostrar zonas de cada mapa
SELECT 
    'ZONAS EN MAPAS' as tipo,
    m.id as mapa_id,
    s.nombre as sala_nombre,
    zona->>'nombre' as zona_nombre,
    zona->>'color' as color,
    zona->>'precio' as precio,
    zona->>'filas' as filas
FROM mapas m
JOIN salas s ON m.sala_id = s.id,
LATERAL jsonb_array_elements(m.contenido->'zonas') AS zona
WHERE m.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY s.nombre, (zona->>'precio')::numeric DESC;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará mapas usando la estructura existente
3. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- 2 mapas creados (Sala Principal y Sala VIP)
- Zonas configuradas con precios y colores
- El mapa debería aparecer en el store
*/
