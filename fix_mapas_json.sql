-- 🔧 Arreglar Creación de Mapas con JSON Correcto
-- Este script crea mapas usando JSON válido

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
    jsonb_build_object(
        'tipo', 'teatro',
        'nombre', 'Mapa Sala Principal',
        'filas', 10,
        'asientos_por_fila', 15,
        'zonas', jsonb_build_array(
            jsonb_build_object(
                'nombre', 'Zona VIP',
                'color', '#FFD700',
                'precio', 150.00,
                'filas', jsonb_build_array(1, 2, 3),
                'asientos', 'todos'
            ),
            jsonb_build_object(
                'nombre', 'Zona General',
                'color', '#4CAF50',
                'precio', 75.00,
                'filas', jsonb_build_array(4, 5, 6, 7),
                'asientos', 'todos'
            ),
            jsonb_build_object(
                'nombre', 'Zona Económica',
                'color', '#2196F3',
                'precio', 45.00,
                'filas', jsonb_build_array(8, 9, 10),
                'asientos', 'todos'
            )
        )
    ) as contenido
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
    jsonb_build_object(
        'tipo', 'teatro',
        'nombre', 'Mapa Sala VIP',
        'filas', 8,
        'asientos_por_fila', 12,
        'zonas', jsonb_build_array(
            jsonb_build_object(
                'nombre', 'Zona VIP Premium',
                'color', '#FFD700',
                'precio', 200.00,
                'filas', jsonb_build_array(1, 2, 3, 4),
                'asientos', 'todos'
            ),
            jsonb_build_object(
                'nombre', 'Zona VIP Estándar',
                'color', '#FFA500',
                'precio', 150.00,
                'filas', jsonb_build_array(5, 6, 7, 8),
                'asientos', 'todos'
            )
        )
    ) as contenido
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND s.nombre = 'Sala VIP'
AND NOT EXISTS (
    SELECT 1 FROM mapas m 
    WHERE m.sala_id = s.id
);

-- =====================================================
-- CREAR MAPA PARA OTRAS SALAS
-- =====================================================

-- Crear mapa para cualquier otra sala que no tenga mapa
INSERT INTO mapas (
    sala_id,
    tenant_id,
    contenido
)
SELECT 
    s.id as sala_id,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id,
    jsonb_build_object(
        'tipo', 'teatro',
        'nombre', 'Mapa ' || s.nombre,
        'filas', 8,
        'asientos_por_fila', 12,
        'zonas', jsonb_build_array(
            jsonb_build_object(
                'nombre', 'Zona VIP',
                'color', '#FFD700',
                'precio', 150.00,
                'filas', jsonb_build_array(1, 2, 3),
                'asientos', 'todos'
            ),
            jsonb_build_object(
                'nombre', 'Zona General',
                'color', '#4CAF50',
                'precio', 75.00,
                'filas', jsonb_build_array(4, 5, 6),
                'asientos', 'todos'
            ),
            jsonb_build_object(
                'nombre', 'Zona Económica',
                'color', '#2196F3',
                'precio', 45.00,
                'filas', jsonb_build_array(7, 8),
                'asientos', 'todos'
            )
        )
    ) as contenido
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND s.nombre NOT IN ('Sala Principal', 'Sala VIP')
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
-- VERIFICAR FUNCIONES CON MAPAS
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
2. Esto creará mapas usando JSON válido
3. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- Todas las salas tendrán mapas
- Las funciones deberían mostrar mapas en el store
*/
