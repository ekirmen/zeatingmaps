-- Verificar y agregar columnas faltantes a comisiones_tasas
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

-- Habilitar RLS si no está habilitado
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'comisiones_tasas' AND relrowsecurity = true) THEN
        ALTER TABLE comisiones_tasas ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Crear políticas RLS si no existen
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
