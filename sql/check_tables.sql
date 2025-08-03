-- Script para verificar el estado de las tablas
-- =====================================================

-- Verificar tablas existentes
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('admin_notifications', 'user_tags', 'user_tag_relations', 'printer_formats') 
        THEN 'FALTA' 
        ELSE 'EXISTE' 
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'admin_notifications',
    'user_tags', 
    'user_tag_relations',
    'printer_formats',
    'payment_transactions',
    'eventos',
    'tags'
);

-- Verificar columnas en payment_transactions
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar foreign keys existentes
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'payment_transactions';

-- Verificar datos en tablas existentes
SELECT 'payment_transactions' as tabla, COUNT(*) as registros FROM payment_transactions
UNION ALL
SELECT 'eventos' as tabla, COUNT(*) as registros FROM eventos
UNION ALL
SELECT 'tags' as tabla, COUNT(*) as registros FROM tags; 