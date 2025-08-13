-- Implementar RLS para la tabla zonas
-- Basado en las políticas existentes mostradas en el dashboard
-- Script idempotente - se puede ejecutar múltiples veces sin errores

-- 1. Habilitar RLS en la tabla zonas (si no está habilitado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'zonas' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado en tabla zonas';
  ELSE
    RAISE NOTICE 'RLS ya estaba habilitado en tabla zonas';
  END IF;
END $$;

-- 2. Verificar y crear políticas solo si no existen
-- Política para gestión completa (ALL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'zonas' 
    AND policyname = 'Users can manage own tenant zonas'
  ) THEN
    CREATE POLICY "Users can manage own tenant zonas" ON zonas
    FOR ALL USING (
      tenant_id IN (
        SELECT tenant_id 
        FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    );
    RAISE NOTICE 'Política "Users can manage own tenant zonas" creada';
  ELSE
    RAISE NOTICE 'Política "Users can manage own tenant zonas" ya existe';
  END IF;
END $$;

-- 3. Política para SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'zonas' 
    AND policyname = 'Users can view own tenant zonas'
  ) THEN
    CREATE POLICY "Users can view own tenant zonas" ON zonas
    FOR SELECT USING (
      tenant_id IN (
        SELECT tenant_id 
        FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    );
    RAISE NOTICE 'Política "Users can view own tenant zonas" creada';
  ELSE
    RAISE NOTICE 'Política "Users can view own tenant zonas" ya existe';
  END IF;
END $$;

-- 4. Política para INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'zonas' 
    AND policyname = 'Users can insert own tenant zonas'
  ) THEN
    CREATE POLICY "Users can insert own tenant zonas" ON zonas
    FOR INSERT WITH CHECK (
      tenant_id IN (
        SELECT tenant_id 
        FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    );
    RAISE NOTICE 'Política "Users can insert own tenant zonas" creada';
  ELSE
    RAISE NOTICE 'Política "Users can insert own tenant zonas" ya existe';
  END IF;
END $$;

-- 5. Política para UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'zonas' 
    AND policyname = 'Users can update own tenant zonas'
  ) THEN
    CREATE POLICY "Users can update own tenant zonas" ON zonas
    FOR UPDATE USING (
      tenant_id IN (
        SELECT tenant_id 
        FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    );
    RAISE NOTICE 'Política "Users can update own tenant zonas" creada';
  ELSE
    RAISE NOTICE 'Política "Users can update own tenant zonas" ya existe';
  END IF;
END $$;

-- 6. Política para DELETE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'zonas' 
    AND policyname = 'Users can delete own tenant zonas'
  ) THEN
    CREATE POLICY "Users can delete own tenant zonas" ON zonas
    FOR DELETE USING (
      tenant_id IN (
        SELECT tenant_id 
        FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    );
    RAISE NOTICE 'Política "Users can delete own tenant zonas" creada';
  ELSE
    RAISE NOTICE 'Política "Users can delete own tenant zonas" ya existe';
  END IF;
END $$;

-- 7. Verificar que la tabla zonas tenga la columna tenant_id
-- Si no existe, agregarla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'zonas' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE zonas ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    RAISE NOTICE 'Columna tenant_id agregada a tabla zonas';
    
    -- Actualizar zonas existentes con el tenant_id de la sala correspondiente
    UPDATE zonas 
    SET tenant_id = (
      SELECT r.tenant_id 
      FROM salas s 
      JOIN recintos r ON s.recinto_id = r.id 
      WHERE s.id = zonas.sala_id
    )
    WHERE tenant_id IS NULL;
    RAISE NOTICE 'Zonas existentes actualizadas con tenant_id';
    
    -- Hacer la columna tenant_id NOT NULL después de actualizar
    ALTER TABLE zonas ALTER COLUMN tenant_id SET NOT NULL;
    RAISE NOTICE 'Columna tenant_id marcada como NOT NULL';
  ELSE
    RAISE NOTICE 'Columna tenant_id ya existe en tabla zonas';
  END IF;
END $$;

-- 8. Crear índices para mejorar el rendimiento (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_zonas_tenant_id ON zonas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_zonas_sala_id ON zonas(sala_id);

-- 9. Verificar el estado final de las políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'zonas'
ORDER BY policyname;

-- 10. Verificar el estado de RLS
SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS habilitado'
    ELSE '❌ RLS deshabilitado'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'zonas' 
AND schemaname = 'public';

-- 11. Verificar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN is_nullable = 'NO' THEN 'NOT NULL'
    ELSE 'nullable'
  END as nullability
FROM information_schema.columns 
WHERE table_name = 'zonas' 
AND table_schema = 'public'
AND column_name IN ('id', 'nombre', 'color', 'aforo', 'numerada', 'sala_id', 'tenant_id', 'created_at', 'updated_at')
ORDER BY ordinal_position;
