-- Verificar columnas existentes en la tabla eventos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'eventos'
ORDER BY ordinal_position; 