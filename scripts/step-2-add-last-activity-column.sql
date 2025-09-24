-- PASO 2: Agregar campo last_activity
-- Ejecutar este script completo en el SQL Editor

ALTER TABLE seat_locks ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW();

-- Verificar que se agregó correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'seat_locks' AND column_name = 'last_activity';
