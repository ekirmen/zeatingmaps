-- Verificar estructura de comisiones_tasas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'comisiones_tasas' 
AND table_schema = 'public'
ORDER BY ordinal_position;
