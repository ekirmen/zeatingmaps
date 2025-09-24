-- PASO 3: Crear índice para consultas de disponibilidad
-- Ejecutar SOLO este comando en el SQL Editor (sin CONCURRENTLY)

CREATE INDEX idx_seat_locks_availability 
ON seat_locks (funcion_id, tenant_id, status, expires_at) 
WHERE status IN ('seleccionado', 'reservado', 'vendido');

-- Verificar que se creó
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'seat_locks' AND indexname = 'idx_seat_locks_availability';
