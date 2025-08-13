-- Script simple para aplicar RLS a la tabla zonas
-- Asume que la estructura ya está correcta (tenant_id, índices, etc.)

-- 1. Habilitar RLS (si no está habilitado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'zonas' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS habilitado en tabla zonas';
  ELSE
    RAISE NOTICE 'ℹ️ RLS ya estaba habilitado en tabla zonas';
  END IF;
END $$;

-- 2. Crear políticas solo si no existen
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
    RAISE NOTICE '✅ Política "Users can manage own tenant zonas" creada';
  ELSE
    RAISE NOTICE 'ℹ️ Política "Users can manage own tenant zonas" ya existe';
  END IF;
END $$;

-- Política para SELECT
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
    RAISE NOTICE '✅ Política "Users can view own tenant zonas" creada';
  ELSE
    RAISE NOTICE 'ℹ️ Política "Users can view own tenant zonas" ya existe';
  END IF;
END $$;

-- Política para INSERT
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
    RAISE NOTICE '✅ Política "Users can insert own tenant zonas" creada';
  ELSE
    RAISE NOTICE 'ℹ️ Política "Users can insert own tenant zonas" ya existe';
  END IF;
END $$;

-- Política para UPDATE
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
    RAISE NOTICE '✅ Política "Users can update own tenant zonas" creada';
  ELSE
    RAISE NOTICE 'ℹ️ Política "Users can update own tenant zonas" ya existe';
  END IF;
END $$;

-- Política para DELETE
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
    RAISE NOTICE '✅ Política "Users can delete own tenant zonas" creada';
  ELSE
    RAISE NOTICE 'ℹ️ Política "Users can delete own tenant zonas" ya existe';
  END IF;
END $$;

-- 3. Verificar estado final
SELECT '🎯 RESUMEN FINAL:' as status;

-- Verificar RLS
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS habilitado'
    ELSE '❌ RLS deshabilitado'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'zonas' 
AND schemaname = 'public';

-- Verificar políticas
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'ALL' THEN '🔄 Todas las operaciones'
    WHEN cmd = 'SELECT' THEN '👁️ Solo lectura'
    WHEN cmd = 'INSERT' THEN '➕ Solo inserción'
    WHEN cmd = 'UPDATE' THEN '✏️ Solo actualización'
    WHEN cmd = 'DELETE' THEN '🗑️ Solo eliminación'
    ELSE '❓ Operación desconocida'
  END as operacion_descripcion
FROM pg_policies 
WHERE tablename = 'zonas'
ORDER BY policyname;

-- Verificar estructura
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
AND column_name IN ('id', 'nombre', 'color', 'aforo', 'numerada', 'sala_id', 'tenant_id')
ORDER BY ordinal_position;
