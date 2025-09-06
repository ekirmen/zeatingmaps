-- Arreglar restricciones de la tabla payment_methods_global

-- 1. Verificar si existe una restricción única
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'payment_methods_global' 
AND table_schema = 'public';

-- 2. Crear restricción única si no existe
DO $$ 
BEGIN
    -- Verificar si ya existe una restricción única en (method_id, tenant_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'payment_methods_global' 
        AND constraint_type = 'UNIQUE'
        AND table_schema = 'public'
    ) THEN
        -- Crear restricción única
        ALTER TABLE payment_methods_global 
        ADD CONSTRAINT payment_methods_global_method_tenant_unique 
        UNIQUE (method_id, tenant_id);
    END IF;
END $$;

-- 3. Verificar que la restricción se creó
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'payment_methods_global' 
AND table_schema = 'public';
