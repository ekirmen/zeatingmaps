-- Verificar y arreglar políticas RLS para payment_methods_global

-- Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'payment_methods_global';

-- Habilitar RLS si no está habilitado
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'payment_methods_global' AND relrowsecurity = true) THEN
        ALTER TABLE payment_methods_global ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado para payment_methods_global';
    ELSE
        RAISE NOTICE 'RLS ya está habilitado para payment_methods_global';
    END IF;
END $$;

-- Eliminar políticas existentes si existen (para recrearlas)
DROP POLICY IF EXISTS "Allow authenticated users to read payment methods" ON payment_methods_global;
DROP POLICY IF EXISTS "Allow authenticated users to update payment methods" ON payment_methods_global;
DROP POLICY IF EXISTS "Allow authenticated users to insert payment methods" ON payment_methods_global;
DROP POLICY IF EXISTS "Allow authenticated users to delete payment methods" ON payment_methods_global;

-- Crear políticas RLS más permisivas para testing
CREATE POLICY "Allow all authenticated users full access" ON payment_methods_global
  FOR ALL USING (auth.role() = 'authenticated');

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'payment_methods_global';
