-- PASO 4: Crear índice para limpieza eficiente
-- Ejecutar SOLO este comando en el SQL Editor (sin CONCURRENTLY)

CREATE INDEX idx_seat_locks_cleanup 
ON seat_locks (last_activity, status) 
WHERE status IN ('seleccionado', 'locked');

-- Verificar que se creó
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'seat_locks' AND indexname = 'idx_seat_locks_cleanup';
