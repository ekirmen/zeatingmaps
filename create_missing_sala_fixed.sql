-- Script corregido para crear la sala faltante
-- Basado en la estructura real de las tablas

-- 1. Primero, verificar qué salas existen
SELECT id, nombre, recinto_id, tenant_id FROM salas ORDER BY id;

-- 2. Verificar qué recintos existen
SELECT id, nombre, tenant_id FROM recintos ORDER BY id;

-- 3. Verificar la función que está intentando acceder al mapa
-- Primero necesitamos entender la estructura de la tabla funciones
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'funciones' 
ORDER BY ordinal_position;

-- 4. Verificar si existe la función con ID 21
SELECT * FROM funciones WHERE id = 21;

-- 5. Verificar la estructura de la tabla funciones
SELECT 
  f.id,
  f.nombre,
  f.sala_id,
  f.recinto_id,
  f.tenant_id,
  -- Intentar encontrar la relación con eventos
  f.evento_id,
  f.evento
FROM funciones f
WHERE f.id = 21;

-- 6. Si la función no tiene sala_id, crear una sala
-- Usar el recinto_id de la función o crear una sala genérica

-- Opción A: Crear sala usando el recinto_id de la función
INSERT INTO salas (nombre, recinto_id, tenant_id, capacidad, fecha_creacion)
SELECT 
  'Sala Principal',
  f.recinto_id,
  f.tenant_id,
  100,
  CURRENT_TIMESTAMP
FROM funciones f
WHERE f.id = 21
  AND f.recinto_id IS NOT NULL
  AND f.sala_id IS NULL
ON CONFLICT DO NOTHING;

-- Opción B: Si la función no tiene recinto_id, usar el recinto_id del evento
-- Primero necesitamos encontrar la relación entre funciones y eventos
-- Esto dependerá de cómo esté estructurada la tabla funciones

-- 7. Actualizar la función para que apunte a la sala creada
UPDATE funciones 
SET sala_id = (
  SELECT id FROM salas 
  WHERE recinto_id = (
    SELECT recinto_id FROM funciones WHERE id = 21
  )
  ORDER BY fecha_creacion DESC 
  LIMIT 1
)
WHERE id = 21;

-- 8. Verificar que la sala se creó correctamente
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

-- 9. Verificar que el mapa ahora es accesible
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

-- 10. Si todo falla, crear una sala manualmente
-- Primero identificar el recinto correcto
SELECT 
  r.id as recinto_id,
  r.nombre as recinto_nombre,
  r.tenant_id
FROM recintos r
WHERE r.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY r.id;

-- Luego crear la sala manualmente
INSERT INTO salas (nombre, recinto_id, tenant_id, capacidad, fecha_creacion)
VALUES (
  'Sala Principal',
  21, -- Usar el recinto_id del "Estadio de Prueba ZeatingMaps"
  '2b86dc35-49ad-43ea-a50d-a14c55a327cc',
  100,
  CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Y actualizar la función
UPDATE funciones 
SET sala_id = (
  SELECT id FROM salas 
  WHERE recinto_id = 21 
  AND tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
  ORDER BY fecha_creacion DESC 
  LIMIT 1
)
WHERE id = 21;
