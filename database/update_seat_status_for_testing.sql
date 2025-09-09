-- Actualizar el estado del asiento seleccionado a vendido para testing
UPDATE seat_locks 
SET status = 'vendido',
    zona_id = 'ORO',
    zona_nombre = 'ORO',
    precio = 10.00
WHERE funcion_id = 43 
  AND status = 'seleccionado'
  AND seat_id = 'silla_1755825682843_2';

-- Verificar el cambio
SELECT 
  seat_id,
  status,
  locator,
  zona_id,
  zona_nombre,
  precio,
  created_at
FROM seat_locks 
WHERE funcion_id = 43
ORDER BY created_at DESC;
