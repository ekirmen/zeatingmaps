-- Script para crear la sala faltante
-- Basado en el diagnóstico que muestra que el mapa existe pero la sala no

-- 1. Primero, verificar qué salas existen
SELECT id, nombre, recinto_id, tenant_id FROM salas ORDER BY id;

-- 2. Verificar qué recintos existen
SELECT id, nombre, tenant_id FROM recintos ORDER BY id;

-- 3. Verificar la función que está intentando acceder al mapa
SELECT 
  f.id as funcion_id,
  f.nombre as funcion_nombre,
  f.sala_id,
  f.recinto_id,
  f.tenant_id,
  e.nombre as evento_nombre
FROM funciones f
JOIN eventos e ON f.evento_id = e.id
WHERE f.id = 21; -- ID de la función del diagnóstico

-- 4. Crear la sala faltante
-- Primero necesitamos saber el recinto_id y tenant_id correctos
-- Basándonos en la función y el evento

-- Opción A: Si la función tiene recinto_id pero no sala_id
INSERT INTO salas (nombre, recinto_id, tenant_id, capacidad, created_at, updated_at)
SELECT 
  'Sala Principal', -- Nombre por defecto
  f.recinto_id,
  f.tenant_id,
  100, -- Capacidad por defecto
  NOW(),
  NOW()
FROM funciones f
WHERE f.id = 21
  AND f.recinto_id IS NOT NULL
  AND f.sala_id IS NULL
ON CONFLICT DO NOTHING;

-- Opción B: Si la función no tiene recinto_id, usar el del evento
INSERT INTO salas (nombre, recinto_id, tenant_id, capacidad, created_at, updated_at)
SELECT 
  'Sala Principal',
  e.recinto_id,
  e.tenant_id,
  100,
  NOW(),
  NOW()
FROM funciones f
JOIN eventos e ON f.evento_id = e.id
WHERE f.id = 21
  AND e.recinto_id IS NOT NULL
  AND f.sala_id IS NULL
ON CONFLICT DO NOTHING;

-- 5. Actualizar la función para que apunte a la sala creada
UPDATE funciones 
SET sala_id = (
  SELECT id FROM salas 
  WHERE recinto_id = (
    SELECT COALESCE(f.recinto_id, e.recinto_id) 
    FROM funciones f 
    JOIN eventos e ON f.evento_id = e.id 
    WHERE f.id = 21
  )
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE id = 21;

-- 6. Verificar que la sala se creó correctamente
SELECT 
  s.id as sala_id,
  s.nombre as sala_nombre,
  s.recinto_id,
  s.tenant_id,
  f.id as funcion_id,
  f.nombre as funcion_nombre
FROM salas s
JOIN funciones f ON f.sala_id = s.id
WHERE f.id = 21;

-- 7. Verificar que el mapa ahora es accesible
SELECT 
  m.id as mapa_id,
  m.sala_id,
  m.tenant_id,
  m.updated_at,
  s.nombre as sala_nombre
FROM mapas m
JOIN salas s ON m.sala_id = s.id
WHERE m.sala_id = (
  SELECT sala_id FROM funciones WHERE id = 21
);
