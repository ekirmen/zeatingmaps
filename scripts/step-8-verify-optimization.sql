-- PASO 8: Verificar optimización completa
-- Ejecutar este script completo en el SQL Editor

-- Verificar todos los índices de seat_locks
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'seat_locks'
ORDER BY indexname;

-- Verificar el campo last_activity
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'seat_locks' AND column_name = 'last_activity';

-- Verificar la función de limpieza
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_name = 'cleanup_expired_locks_optimized';

-- Verificar la vista de monitoreo
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_name = 'seat_locks_monitoring';

-- Verificar el trigger
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'seat_locks' AND trigger_name = 'tr_seat_locks_update_activity';

-- Mostrar resumen
SELECT 'Optimización de seat_locks completada exitosamente' as resultado;
