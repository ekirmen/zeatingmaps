-- Script para verificar y configurar precios de zonas
-- Este script ayuda a asegurar que las zonas tengan precios configurados

-- 1. Verificar plantillas de precios existentes
SELECT 
    'plantillas_precios' as table_name,
    COUNT(*) as total_plantillas,
    COUNT(CASE WHEN detalles IS NOT NULL THEN 1 END) as con_detalles,
    COUNT(CASE WHEN detalles IS NULL THEN 1 END) as sin_detalles
FROM plantillas_precios;

-- 2. Verificar detalles de plantillas
SELECT 
    id,
    nombre,
    CASE 
        WHEN detalles IS NULL THEN 'NULL'
        WHEN detalles = '' THEN 'VACIO'
        WHEN detalles::text LIKE '{%' THEN 'JSON_VALIDO'
        ELSE 'TEXTO'
    END as tipo_detalles,
    LENGTH(detalles::text) as longitud_detalles
FROM plantillas_precios 
WHERE detalles IS NOT NULL 
LIMIT 10;

-- 3. Verificar zonas existentes
SELECT 
    'zonas' as table_name,
    COUNT(*) as total_zonas,
    COUNT(CASE WHEN nombre IS NOT NULL THEN 1 END) as con_nombre,
    COUNT(CASE WHEN nombre IS NULL THEN 1 END) as sin_nombre,
    COUNT(CASE WHEN color IS NOT NULL THEN 1 END) as con_color,
    COUNT(CASE WHEN color IS NULL THEN 1 END) as sin_color
FROM zonas;

-- 4. Verificar relación entre zonas y plantillas
SELECT 
    pp.id as plantilla_id,
    pp.nombre as plantilla_nombre,
    COUNT(z.id) as zonas_asociadas,
    STRING_AGG(z.nombre, ', ') as nombres_zonas
FROM plantillas_precios pp
LEFT JOIN zonas z ON z.id = ANY(
    CASE 
        WHEN pp.detalles IS NOT NULL AND pp.detalles::text LIKE '[%' THEN
            (SELECT ARRAY_AGG((detalle->>'zona')::int)
             FROM jsonb_array_elements(pp.detalles::jsonb) as detalle
             WHERE detalle->>'zona' IS NOT NULL)
        ELSE NULL
    END
)
GROUP BY pp.id, pp.nombre
ORDER BY pp.id;

-- 5. Verificar precios por zona
SELECT 
    z.id as zona_id,
    z.nombre as zona_nombre,
    pp.nombre as plantilla_nombre,
    detalle->>'precio' as precio,
    detalle->>'zona' as zona_id_detalle
FROM zonas z
JOIN plantillas_precios pp ON pp.detalles IS NOT NULL
CROSS JOIN LATERAL jsonb_array_elements(pp.detalles::jsonb) as detalle
WHERE (detalle->>'zona')::int = z.id
ORDER BY z.id, pp.id;

-- 6. Crear plantilla de precios de ejemplo si no existe
INSERT INTO plantillas_precios (nombre, descripcion, detalles)
SELECT 
    'Plantilla Básica',
    'Plantilla de precios básica para eventos',
    '[
        {"zona": 1, "precio": 50, "nombre": "General"},
        {"zona": 2, "precio": 75, "nombre": "Preferencial"},
        {"zona": 3, "precio": 100, "nombre": "VIP"}
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM plantillas_precios WHERE nombre = 'Plantilla Básica'
);

-- 7. Verificar funciones sin plantilla
SELECT 
    f.id as funcion_id,
    f.nombre as funcion_nombre,
    e.nombre as evento_nombre,
    CASE 
        WHEN f.plantilla_id IS NULL THEN 'SIN_PLANTILLA'
        ELSE 'CON_PLANTILLA'
    END as estado_plantilla
FROM funciones f
JOIN eventos e ON e.id = f.evento_id
WHERE f.plantilla_id IS NULL
ORDER BY f.id;

-- 8. Estadísticas finales
SELECT 
    'RESUMEN' as tipo,
    (SELECT COUNT(*) FROM plantillas_precios) as total_plantillas,
    (SELECT COUNT(*) FROM zonas) as total_zonas,
    (SELECT COUNT(*) FROM funciones WHERE plantilla_id IS NOT NULL) as funciones_con_plantilla,
    (SELECT COUNT(*) FROM funciones WHERE plantilla_id IS NULL) as funciones_sin_plantilla; 