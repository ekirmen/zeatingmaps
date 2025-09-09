-- Agregar más asientos con diferentes estados para testing
-- Primero eliminar asientos existentes para evitar conflictos
DELETE FROM seat_locks WHERE seat_id IN (
  'silla_1755825682843_1',
  'silla_1755825682843_3', 
  'silla_1755825682843_4',
  'silla_1755825682843_5'
) AND funcion_id = 43;

-- Insertar nuevos asientos
INSERT INTO seat_locks (
  seat_id,
  funcion_id,
  session_id,
  status,
  locked_at,
  expires_at,
  lock_type,
  tenant_id,
  locator,
  zona_id,
  zona_nombre,
  precio
) VALUES 
  -- Asiento reservado
  ('silla_1755825682843_1', 43, 'test-session-1', 'reservado', NOW(), NULL, 'seat', '9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'RESERVA-001', 'ORO', 'ORO', 10.00),
  
  -- Asiento seleccionado por otro usuario
  ('silla_1755825682843_3', 43, 'test-session-2', 'seleccionado', NOW(), NOW() + INTERVAL '15 minutes', 'seat', '9dbdb86f-8424-484c-bb76-0d9fa27573c8', NULL, 'ORO', 'ORO', 10.00),
  
  -- Asiento bloqueado permanentemente
  ('silla_1755825682843_4', 43, 'test-session-3', 'locked', NOW(), NULL, 'seat', '9dbdb86f-8424-484c-bb76-0d9fa27573c8', NULL, 'ORO', 'ORO', 10.00),
  
  -- Asiento anulado
  ('silla_1755825682843_5', 43, 'test-session-4', 'anulado', NOW(), NULL, 'seat', '9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'ANULADO-001', 'ORO', 'ORO', 10.00);

-- Verificar todos los asientos
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
ORDER BY seat_id;
