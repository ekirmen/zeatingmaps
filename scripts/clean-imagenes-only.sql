-- Script simple para limpiar solo el campo 'imagenes' corrupto
-- Basado en el error reportado por el usuario

-- 1. Verificar eventos con campo 'imagenes' corrupto
SELECT 
  id,
  nombre,
  "imagenes"::text as imagenes_raw
FROM eventos 
WHERE "imagenes"::text ~ '"[0-9]+"';

-- 2. Limpiar el campo 'imagenes' corrupto
UPDATE eventos 
SET "imagenes" = '{}' 
WHERE "imagenes"::text ~ '"[0-9]+"';

-- 3. Verificar que se limpió correctamente
SELECT 
  id,
  nombre,
  "imagenes"::text as imagenes_after_cleanup
FROM eventos 
WHERE id IN (
  SELECT id FROM eventos 
  WHERE "imagenes"::text ~ '"[0-9]+"'
);

-- 4. Contar cuántos eventos se limpiaron
SELECT 
  COUNT(*) as total_eventos,
  COUNT(CASE WHEN "imagenes"::text ~ '"[0-9]+"' THEN 1 END) as imagenes_corruptos_restantes
FROM eventos;
