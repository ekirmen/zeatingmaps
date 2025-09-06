-- Migración completa para arreglar ambas tablas
-- Esta migración verifica y agrega todas las columnas necesarias

-- ============================================
-- ARREGLAR TABLA comisiones_tasas
-- ============================================

-- Agregar columna 'name' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comisiones_tasas' 
                   AND column_name = 'name' 
                   AND table_schema = 'public') THEN
        ALTER TABLE comisiones_tasas ADD COLUMN name VARCHAR(255);
    END IF;
END $$;

-- Agregar columna 'type' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comisiones_tasas' 
                   AND column_name = 'type' 
                   AND table_schema = 'public') THEN
        ALTER TABLE comisiones_tasas ADD COLUMN type VARCHAR(50) DEFAULT 'percentage';
    END IF;
END $$;

-- Agregar columna 'value' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comisiones_tasas' 
                   AND column_name = 'value' 
                   AND table_schema = 'public') THEN
        ALTER TABLE comisiones_tasas ADD COLUMN value JSONB DEFAULT '{}';
    END IF;
END $$;

-- Agregar columna 'description' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comisiones_tasas' 
                   AND column_name = 'description' 
                   AND table_schema = 'public') THEN
        ALTER TABLE comisiones_tasas ADD COLUMN description TEXT;
    END IF;
END $$;

-- Agregar columna 'is_active' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comisiones_tasas' 
                   AND column_name = 'is_active' 
                   AND table_schema = 'public') THEN
        ALTER TABLE comisiones_tasas ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Agregar columna 'created_at' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comisiones_tasas' 
                   AND column_name = 'created_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE comisiones_tasas ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Agregar columna 'updated_at' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comisiones_tasas' 
                   AND column_name = 'updated_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE comisiones_tasas ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ============================================
-- ARREGLAR TABLA payment_methods_global
-- ============================================

-- Agregar columna 'method_id' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_methods_global' 
                   AND column_name = 'method_id' 
                   AND table_schema = 'public') THEN
        ALTER TABLE payment_methods_global ADD COLUMN method_id VARCHAR(50);
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

-- ============================================
-- HABILITAR RLS Y CREAR POLÍTICAS
-- ============================================

-- Habilitar RLS para comisiones_tasas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'comisiones_tasas' AND relrowsecurity = true) THEN
        ALTER TABLE comisiones_tasas ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Habilitar RLS para payment_methods_global
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'payment_methods_global' AND relrowsecurity = true) THEN
        ALTER TABLE payment_methods_global ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Crear políticas para comisiones_tasas
DO $$ 
BEGIN
    -- Política de lectura
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comisiones_tasas' AND policyname = 'Allow authenticated users to read comisiones_tasas') THEN
        CREATE POLICY "Allow authenticated users to read comisiones_tasas" ON comisiones_tasas
          FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    -- Política de actualización
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comisiones_tasas' AND policyname = 'Allow authenticated users to update comisiones_tasas') THEN
        CREATE POLICY "Allow authenticated users to update comisiones_tasas" ON comisiones_tasas
          FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
    
    -- Política de inserción
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comisiones_tasas' AND policyname = 'Allow authenticated users to insert comisiones_tasas') THEN
        CREATE POLICY "Allow authenticated users to insert comisiones_tasas" ON comisiones_tasas
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    -- Política de eliminación
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comisiones_tasas' AND policyname = 'Allow authenticated users to delete comisiones_tasas') THEN
        CREATE POLICY "Allow authenticated users to delete comisiones_tasas" ON comisiones_tasas
          FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Crear políticas para payment_methods_global
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
