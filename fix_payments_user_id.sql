-- Script para agregar columna user_id a la tabla payments
-- Esto resuelve el error "No se puede insertar un pago sin usuario_id"

-- 1. Agregar columna user_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.payments 
        ADD COLUMN user_id uuid;
        
        RAISE NOTICE 'Columna user_id agregada a payments';
    ELSE
        RAISE NOTICE 'Columna user_id ya existe en payments';
    END IF;
END $$;

-- 2. Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id 
ON public.payments(user_id);

-- 3. Agregar foreign key constraint si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payments_user_id_fkey'
    ) THEN
        ALTER TABLE public.payments 
        ADD CONSTRAINT payments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key constraint agregado';
    ELSE
        RAISE NOTICE 'Foreign key constraint ya existe';
    END IF;
END $$;

-- 4. Verificar la estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
