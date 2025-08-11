-- Script para verificar y corregir la columna user_id en la tabla payments
-- Nota: La columna user_id ya existe en tu tabla, solo necesitamos verificar que esté configurada correctamente

-- 1. Verificar que la columna user_id existe
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name = 'user_id';

-- 2. Verificar que el índice existe
SELECT 
    indexname, 
    tablename, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'payments' AND indexname LIKE '%user_id%';

-- 3. Verificar que la foreign key existe
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'payments' 
    AND kcu.column_name = 'user_id';

-- 4. Si no existe la foreign key, crearla (ejecutar solo si es necesario)
-- ALTER TABLE public.payments 
-- ADD CONSTRAINT fk_payments_user_id 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Verificar la estructura completa de la tabla payments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
