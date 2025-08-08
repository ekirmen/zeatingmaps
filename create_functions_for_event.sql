-- 🚀 Crear Funciones para el Evento
-- Este script crea funciones para el evento existente

-- =====================================================
-- VERIFICAR DATOS EXISTENTES
-- =====================================================

-- Verificar evento existente
SELECT 
    'EVENTO EXISTENTE' as tipo,
    id,
    nombre,
    slug,
    fecha_evento,
    recinto
FROM eventos 
WHERE slug = 'evento-prueba-zeatingmaps';

-- Verificar recinto existente
SELECT 
    'RECINTO EXISTENTE' as tipo,
    id,
    nombre,
    capacidad
FROM recintos 
WHERE nombre = 'Estadio de Prueba';

-- =====================================================
-- CREAR SALA PARA EL RECINTO
-- =====================================================

-- Crear sala si no existe
INSERT INTO salas (
    nombre,
    capacidad,
    recinto_id
)
SELECT 
    'Sala Principal',
    2000,
    r.id
FROM recintos r
WHERE r.nombre = 'Estadio de Prueba'
AND NOT EXISTS (
    SELECT 1 FROM salas s 
    WHERE s.nombre = 'Sala Principal' 
    AND s.recinto_id = r.id
);

-- =====================================================
-- CREAR FUNCIONES PARA EL EVENTO
-- =====================================================

-- Crear función principal
INSERT INTO funciones (
    nombre,
    fecha,
    hora,
    evento_id,
    sala_id
)
SELECT 
    'Función Principal',
    e.fecha_evento,
    '20:00:00',
    e.id,
    s.id
FROM eventos e
JOIN salas s ON s.recinto_id = e.recinto
WHERE e.slug = 'evento-prueba-zeatingmaps'
AND s.nombre = 'Sala Principal'
AND NOT EXISTS (
    SELECT 1 FROM funciones f 
    WHERE f.evento_id = e.id 
    AND f.nombre = 'Función Principal'
);

-- Crear función adicional
INSERT INTO funciones (
    nombre,
    fecha,
    hora,
    evento_id,
    sala_id
)
SELECT 
    'Función Matiné',
    e.fecha_evento,
    '16:00:00',
    e.id,
    s.id
FROM eventos e
JOIN salas s ON s.recinto_id = e.recinto
WHERE e.slug = 'evento-prueba-zeatingmaps'
AND s.nombre = 'Sala Principal'
AND NOT EXISTS (
    SELECT 1 FROM funciones f 
    WHERE f.evento_id = e.id 
    AND f.nombre = 'Función Matiné'
);

-- =====================================================
-- VERIFICAR FUNCIONES CREADAS
-- =====================================================

-- Verificar funciones creadas
SELECT 
    'FUNCIONES CREADAS' as tipo,
    f.id,
    f.nombre,
    f.fecha,
    f.hora,
    e.nombre as evento,
    s.nombre as sala
FROM funciones f
JOIN eventos e ON f.evento_id = e.id
JOIN salas s ON f.sala_id = s.id
WHERE e.slug = 'evento-prueba-zeatingmaps'
ORDER BY f.hora;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará funciones para el evento existente
3. Verifica que puedas ver las funciones en el store

FUNCIONES CREADAS:
- Función Principal (20:00)
- Función Matiné (16:00)

PARA VERIFICAR QUE FUNCIONA:
- Ve a https://zeatingmaps-ekirmens-projects.vercel.app/store
- Haz clic en el evento
- Deberías ver las funciones disponibles
*/
