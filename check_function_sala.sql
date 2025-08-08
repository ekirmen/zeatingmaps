-- 🔍 Verificar Sala de la Función
-- Este script verifica qué sala tiene la función y crea mapa si es necesario

-- =====================================================
-- VERIFICAR FUNCIÓN Y SU SALA
-- =====================================================

-- Buscar la función por ID o nombre
SELECT 
    'FUNCIÓN ENCONTRADA' as tipo,
    f.id,
    f.evento,
    f.sala,
    f.fecha_celebracion,
    e.nombre as evento_nombre,
    s.nombre as sala_nombre,
    s.id as sala_id
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LEFT JOIN salas s ON f.sala = s.id
WHERE f.id = 10  -- ID de la función que aparece en los logs
OR f.evento = '5985277e-df15-45ec-bab7-751063f5251c'  -- Evento del log
ORDER BY f.fecha_celebracion;

-- =====================================================
-- VERIFICAR MAPA DE LA SALA
-- =====================================================

-- Verificar si la sala tiene mapa
SELECT 
    'MAPA DE SALA' as tipo,
    s.id as sala_id,
    s.nombre as sala_nombre,
    m.id as mapa_id,
    m.contenido->>'nombre' as nombre_mapa,
    m.contenido->>'tipo' as tipo_mapa
FROM salas s
LEFT JOIN mapas m ON s.id = m.sala_id
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY s.nombre;

-- =====================================================
-- CREAR MAPA PARA SALA SIN MAPA
-- =====================================================

-- Crear mapa para cualquier sala que no tenga mapa
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
        "nombre": "Mapa ' || s.nombre || '",
        "filas": 8,
        "asientos_por_fila": 12,
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
                "filas": [4, 5, 6],
                "asientos": "todos"
            },
            {
                "nombre": "Zona Económica",
                "color": "#2196F3",
                "precio": 45.00,
                "filas": [7, 8],
                "asientos": "todos"
            }
        ]
    }'::jsonb as contenido
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND NOT EXISTS (
    SELECT 1 FROM mapas m 
    WHERE m.sala_id = s.id
);

-- =====================================================
-- VERIFICAR TODAS LAS FUNCIONES Y SUS MAPAS
-- =====================================================

-- Mostrar todas las funciones con sus salas y mapas
SELECT 
    'FUNCIONES CON MAPAS' as tipo,
    f.id as funcion_id,
    f.fecha_celebracion,
    e.nombre as evento_nombre,
    s.nombre as sala_nombre,
    CASE 
        WHEN m.id IS NOT NULL THEN '✅ Tiene mapa'
        ELSE '❌ Sin mapa'
    END as estado_mapa,
    m.contenido->>'nombre' as nombre_mapa
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LEFT JOIN salas s ON f.sala = s.id
LEFT JOIN mapas m ON s.id = m.sala_id
WHERE f.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY f.fecha_celebracion;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará mapas para todas las salas que no tengan
3. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- Todas las salas tendrán mapas
- Las funciones deberían mostrar mapas en el store
*/
