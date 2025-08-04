-- Script para verificar que la boletería esté funcionando correctamente
-- Ejecutar después de aplicar los fixes

-- 1. Verificar que la tabla zonas existe y tiene datos
SELECT 
    'zonas' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT sala_id) as salas_con_zonas
FROM zonas;

-- 2. Verificar zonas específicas de la sala 7
SELECT 
    z.id,
    z.nombre,
    z.sala_id,
    z.color,
    z.precio_base,
    s.nombre as sala_nombre
FROM zonas z
LEFT JOIN salas s ON z.sala_id = s.id
WHERE z.sala_id = 7
ORDER BY z.nombre;

-- 3. Verificar que la tabla mapas existe y tiene el formato correcto
SELECT 
    'mapas' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN sala_id = 7 THEN 1 END) as mapas_sala_7
FROM mapas;

-- 4. Verificar el contenido del mapa de la sala 7
SELECT 
    m.id,
    m.sala_id,
    jsonb_array_length(m.contenido) as zonas_en_mapa,
    jsonb_typeof(m.contenido) as tipo_contenido
FROM mapas m
WHERE m.sala_id = 7;

-- 5. Verificar la estructura del contenido del mapa
SELECT 
    m.contenido->0 as primera_zona,
    jsonb_array_length(m.contenido->0->'sillas') as asientos_en_primera_zona
FROM mapas m
WHERE m.sala_id = 7;

-- 6. Verificar que hay eventos activos
SELECT 
    'eventos' as tabla,
    COUNT(*) as total_eventos,
    COUNT(CASE WHEN activo = true THEN 1 END) as eventos_activos
FROM eventos;

-- 7. Verificar que hay funciones
SELECT 
    'funciones' as tabla,
    COUNT(*) as total_funciones,
    COUNT(CASE WHEN sala = 7 THEN 1 END) as funciones_sala_7
FROM funciones;

-- 8. Verificar que hay salas
SELECT 
    'salas' as tabla,
    COUNT(*) as total_salas,
    COUNT(CASE WHEN id = 7 THEN 1 END) as sala_7_existe
FROM salas;

-- 9. Verificar relación completa
SELECT 
    e.nombre as evento_nombre,
    f.nombre as funcion_nombre,
    s.nombre as sala_nombre,
    COUNT(z.id) as zonas_en_sala
FROM eventos e
JOIN funciones f ON e.id = f.evento
JOIN salas s ON f.sala = s.id
LEFT JOIN zonas z ON s.id = z.sala_id
WHERE s.id = 7
GROUP BY e.nombre, f.nombre, s.nombre;

-- 10. Verificar que el mapa tiene el formato correcto
SELECT 
    CASE 
        WHEN jsonb_typeof(m.contenido) = 'array' THEN '✅ Formato correcto (array)'
        ELSE '❌ Formato incorrecto'
    END as formato_mapa,
    CASE 
        WHEN jsonb_array_length(m.contenido) > 0 THEN '✅ Tiene zonas'
        ELSE '❌ No tiene zonas'
    END as tiene_zonas,
    CASE 
        WHEN m.contenido->0->>'type' = 'zona' THEN '✅ Formato de zona correcto'
        ELSE '❌ Formato de zona incorrecto'
    END as formato_zona
FROM mapas m
WHERE m.sala_id = 7; 