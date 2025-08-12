-- Script corregido para crear la sala faltante
-- Basado en la estructura real: funciones -> eventos -> salas/recintos

-- 1. Primero, verificar qué salas existen
SELECT id, nombre, recinto_id, tenant_id FROM salas ORDER BY id;

-- 2. Verificar qué recintos existen
SELECT id, nombre, tenant_id FROM recintos ORDER BY id;

-- 3. Verificar la estructura de la tabla funciones
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'funciones' 
ORDER BY ordinal_position;

-- 4. Verificar la función con ID 21 y su relación con eventos
SELECT 
  f.id,
  f.evento, -- Campo que relaciona con eventos
  f.sala,   -- Campo que relaciona con salas
  f.recinto_id,
  f.tenant_id
FROM funciones f
WHERE f.id = 21;

-- 5. Verificar la estructura de la tabla eventos
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'eventos' 
ORDER BY ordinal_position;

-- 6. Verificar el evento relacionado con la función 21
SELECT 
  e.id as evento_id,
  e.nombre as evento_nombre,
  e.sala,
  e.recinto_id,
  e.tenant_id
FROM eventos e
JOIN funciones f ON f.evento = e.id
WHERE f.id = 21;

-- 7. Verificar si existe la sala que necesita el evento
SELECT 
  s.id as sala_id,
  s.nombre as sala_nombre,
  s.recinto_id,
  s.tenant_id
FROM salas s
WHERE s.id = (
  SELECT e.sala FROM eventos e 
  JOIN funciones f ON f.evento = e.id 
  WHERE f.id = 21
);

-- 8. Si la sala no existe, crearla usando el recinto_id del evento
INSERT INTO salas (nombre, recinto_id, tenant_id, capacidad, fecha_creacion)
SELECT 
  'Sala Principal',
  e.recinto_id,
  e.tenant_id,
  100,
  CURRENT_TIMESTAMP
FROM eventos e
JOIN funciones f ON f.evento = e.id
WHERE f.id = 21
  AND e.sala IS NULL
  AND e.recinto_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 9. Actualizar el evento para que apunte a la sala creada
UPDATE eventos 
SET sala = (
  SELECT id FROM salas 
  WHERE recinto_id = (
    SELECT e.recinto_id 
    FROM eventos e 
    JOIN funciones f ON f.evento = e.id 
    WHERE f.id = 21
  )
  ORDER BY fecha_creacion DESC 
  LIMIT 1
)
WHERE id = (
  SELECT e.id 
  FROM eventos e 
  JOIN funciones f ON f.evento = e.id 
  WHERE f.id = 21
);

-- 10. Verificar que la sala se creó y el evento la apunta
SELECT 
  s.id as sala_id,
  s.nombre as sala_nombre,
  s.recinto_id,
  s.tenant_id,
  e.id as evento_id,
  e.nombre as evento_nombre,
  e.sala,
  f.id as funcion_id
FROM salas s
JOIN eventos e ON e.sala = s.id
JOIN funciones f ON f.evento = e.id
WHERE f.id = 21;

-- 11. Verificar que el mapa ahora es accesible
SELECT 
  m.id as mapa_id,
  m.sala_id,
  m.tenant_id,
  m.updated_at,
  s.nombre as sala_nombre,
  e.nombre as evento_nombre
FROM mapas m
JOIN salas s ON m.sala_id = s.id
JOIN eventos e ON e.sala = s.id
WHERE m.sala_id = (
  SELECT e.sala 
  FROM eventos e 
  JOIN funciones f ON f.evento = e.id 
  WHERE f.id = 21
);

-- 12. Si todo falla, crear la sala manualmente usando el recinto del evento
-- Primero identificar el recinto correcto del evento
SELECT 
  r.id as recinto_id,
  r.nombre as recinto_nombre,
  r.tenant_id,
  e.id as evento_id,
  e.nombre as evento_nombre
FROM recintos r
JOIN eventos e ON e.recinto_id = r.id
JOIN funciones f ON f.evento = e.id
WHERE f.id = 21;

-- Luego crear la sala manualmente
INSERT INTO salas (nombre, recinto_id, tenant_id, capacidad, fecha_creacion)
SELECT 
  'Sala Principal',
  e.recinto_id,
  e.tenant_id,
  100,
  CURRENT_TIMESTAMP
FROM eventos e
JOIN funciones f ON f.evento = e.id
WHERE f.id = 21
ON CONFLICT DO NOTHING;

-- Y actualizar el evento
UPDATE eventos 
SET sala = (
  SELECT id FROM salas 
  WHERE recinto_id = (
    SELECT e.recinto_id 
    FROM eventos e 
    JOIN funciones f ON f.evento = e.id 
    WHERE f.id = 21
  )
  ORDER BY fecha_creacion DESC 
  LIMIT 1
)
WHERE id = (
  SELECT e.id 
  FROM eventos e 
  JOIN funciones f ON f.evento = e.id 
  WHERE f.id = 21
);
