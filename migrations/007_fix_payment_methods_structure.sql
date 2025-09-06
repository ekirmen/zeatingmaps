-- Verificar y agregar columnas faltantes a payment_methods_global
-- Agregar columna 'method_id' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_methods_global' 
                   AND column_name = 'method_id' 
                   AND table_schema = 'public') THEN
        ALTER TABLE payment_methods_global ADD COLUMN method_id VARCHAR(50) UNIQUE;
    END IF;
END $$;

-- Agregar columna 'enabled' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_methods_global' 
                   AND column_name = 'enabled' 
                   AND table_schema = 'public') THEN
        ALTER TABLE payment_methods_global ADD COLUMN enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Agregar columna 'config' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_methods_global' 
                   AND column_name = 'config' 
                   AND table_schema = 'public') THEN
        ALTER TABLE payment_methods_global ADD COLUMN config JSONB DEFAULT '{}';
    END IF;
END $$;

-- Agregar columna 'created_at' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_methods_global' 
                   AND column_name = 'created_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE payment_methods_global ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Agregar columna 'updated_at' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_methods_global' 
                   AND column_name = 'updated_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE payment_methods_global ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Habilitar RLS si no está habilitado
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'payment_methods_global' AND relrowsecurity = true) THEN
        ALTER TABLE payment_methods_global ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Crear políticas RLS si no existen
DO $$ 
BEGIN
    -- Política de lectura
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods_global' AND policyname = 'Allow authenticated users to read payment methods') THEN
        CREATE POLICY "Allow authenticated users to read payment methods" ON payment_methods_global
          FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    -- Política de actualización
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods_global' AND policyname = 'Allow authenticated users to update payment methods') THEN
        CREATE POLICY "Allow authenticated users to update payment methods" ON payment_methods_global
          FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
    
    -- Política de inserción
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods_global' AND policyname = 'Allow authenticated users to insert payment methods') THEN
        CREATE POLICY "Allow authenticated users to insert payment methods" ON payment_methods_global
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;
