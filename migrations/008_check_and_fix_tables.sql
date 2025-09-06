-- Verificar estructura actual de las tablas y mostrar qué columnas existen
-- Esto nos ayudará a entender qué columnas faltan

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

-- Verificar estructura de payment_methods_global
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_methods_global' 
AND table_schema = 'public'
ORDER BY ordinal_position;
