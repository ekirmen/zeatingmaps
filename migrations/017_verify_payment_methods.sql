-- Verificar configuración de métodos de pago

-- 1. Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_methods_global' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar datos existentes
SELECT method_id, enabled, tenant_id, created_at 
FROM payment_methods_global 
WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
ORDER BY method_id;

-- 3. Contar métodos por estado
SELECT 
    enabled,
    COUNT(*) as count
FROM payment_methods_global 
WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
GROUP BY enabled;

-- 4. Verificar que todos los métodos esperados existen
SELECT 
    CASE 
        WHEN COUNT(*) = 8 THEN '✅ Todos los métodos están presentes'
        ELSE '❌ Faltan métodos: ' || (8 - COUNT(*))::text
    END as status
FROM payment_methods_global 
WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid;
