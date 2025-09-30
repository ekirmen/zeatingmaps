-- Limpiar todos los registros de seat_locks que no están pagados
-- para la función 43

-- Ver los registros actuales antes de borrar
SELECT 
  id,
  seat_id,
  table_id,
  funcion_id,
  status,
  locked_at,
  expires_at,
  session_id,
  user_id
FROM seat_locks
WHERE funcion_id = 43
ORDER BY locked_at DESC;

-- Borrar solo los registros que NO están pagados/vendidos/completados
DELETE FROM seat_locks
WHERE funcion_id = 43
AND status NOT IN ('pagado', 'vendido', 'completed', 'reservado')
AND (expires_at < NOW() OR expires_at IS NULL);

-- Ver los registros después de borrar
SELECT 
  id,
  seat_id,
  table_id,
  funcion_id,
  status,
  locked_at,
  expires_at,
  session_id,
  user_id
FROM seat_locks
WHERE funcion_id = 43
ORDER BY locked_at DESC;
