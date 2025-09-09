-- Verificar el estado actual de seat_locks para la función 43
SELECT 
  seat_id,
  status,
  locator,
  user_id,
  session_id,
  zona_id,
  zona_nombre,
  precio,
  created_at,
  locked_at,
  expires_at
FROM seat_locks 
WHERE funcion_id = 43
ORDER BY created_at DESC;

-- Verificar si existen asientos con localizador
SELECT 
  COUNT(*) as total_seats,
  COUNT(locator) as seats_with_locator,
  COUNT(zona_id) as seats_with_zone,
  COUNT(precio) as seats_with_price
FROM seat_locks 
WHERE funcion_id = 43;

-- Verificar estados de los asientos
SELECT 
  status,
  COUNT(*) as count
FROM seat_locks 
WHERE funcion_id = 43
GROUP BY status
ORDER BY count DESC;
