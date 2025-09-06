-- Agregar solo las columnas faltantes a comisiones_tasas
-- Basado en la estructura que necesitamos

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
