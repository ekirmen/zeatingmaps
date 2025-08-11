-- Script para verificar y corregir la estructura de la tabla payments
-- Esto resuelve el error "No se puede insertar un pago sin usuario_id"

-- 1. Verificar la estructura actual de la tabla payments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- 2. Verificar las constraints existentes
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'payments'
ORDER BY tc.constraint_name;

-- 3. Verificar los índices existentes
SELECT 
    indexname, 
    tablename, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'payments'
ORDER BY indexname;

-- 4. Verificar si hay triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'payments';

-- 5. Verificar datos de ejemplo en payments
SELECT 
    id,
    usuario_id,
    user_id,
    processed_by,
    event,
    funcion,
    locator,
    status,
    created_at
FROM payments 
LIMIT 5;

-- 6. Si hay problemas con usuario_id, asegurar que no sea NULL para registros existentes
-- (Opcional: ejecutar solo si es necesario)
-- UPDATE payments 
-- SET usuario_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com') 
-- WHERE usuario_id IS NULL AND user_id IS NOT NULL;

-- 7. Verificar que no haya conflictos entre user_id y usuario_id
SELECT 
    COUNT(*) as total_payments,
    COUNT(CASE WHEN usuario_id IS NOT NULL THEN 1 END) as with_usuario_id,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id,
    COUNT(CASE WHEN usuario_id IS NULL AND user_id IS NULL THEN 1 END) as without_user
FROM payments;
