-- 🔍 Verificar y Arreglar Plantilla de Precios
-- Este script verifica las zonas y crea un mapa para las salas

-- =====================================================
-- VERIFICAR ZONAS CREADAS
-- =====================================================

-- Mostrar zonas de la plantilla
SELECT 
    'ZONAS DE PRECIOS' as tipo,
    zp.id,
    zp.nombre,
    zp.precio,
    zp.color,
    zp.descripcion,
    pp.nombre as plantilla_nombre
FROM zonas_precios zp
JOIN plantillas_precios pp ON zp.plantilla_id = pp.id
WHERE pp.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY zp.precio DESC;

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
    nombre,
    sala_id,
    tenant_id,
    configuracion
)
SELECT 
    'Mapa Sala Principal' as nombre,
    s.id as sala_id,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id,
    '{
        "tipo": "teatro",
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
    }'::jsonb as configuracion
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
    nombre,
    sala_id,
    tenant_id,
    configuracion
)
SELECT 
    'Mapa Sala VIP' as nombre,
    s.id as sala_id,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id,
    '{
        "tipo": "teatro",
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
    }'::jsonb as configuracion
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
    m.nombre,
    m.sala_id,
    s.nombre as sala_nombre,
    m.configuracion->>'tipo' as tipo_mapa,
    m.configuracion->>'filas' as filas,
    m.configuracion->>'asientos_por_fila' as asientos_por_fila
FROM mapas m
JOIN salas s ON m.sala_id = s.id
WHERE m.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY s.nombre;

-- =====================================================
-- VERIFICAR PLANTILLA COMPLETA
-- =====================================================

-- Verificar plantilla con zonas
SELECT 
    'PLANTILLA COMPLETA' as tipo,
    pp.id,
    pp.nombre,
    pp.tenant_id,
    COUNT(zp.id) as total_zonas,
    STRING_AGG(zp.nombre, ', ') as zonas
FROM plantillas_precios pp
LEFT JOIN zonas_precios zp ON pp.id = zp.plantilla_id
WHERE pp.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
GROUP BY pp.id, pp.nombre, pp.tenant_id;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará mapas para las salas existentes
3. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- 3 zonas de precios creadas
- 2 mapas creados (Sala Principal y Sala VIP)
- El mapa debería aparecer en el store
*/
