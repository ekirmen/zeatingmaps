-- =====================================================
-- SCRIPT PARA LIMPIAR POLÍTICAS RLS DUPLICADAS
-- =====================================================

-- 1. DIAGNÓSTICO: Verificar políticas existentes
SELECT 
  'evento_imagenes' as tabla,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'evento_imagenes'
UNION ALL
SELECT 
  'recinto_imagenes' as tabla,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'recinto_imagenes';

-- 2. LIMPIAR POLÍTICAS DUPLICADAS
DO $$
DECLARE
  policy_rec RECORD;
  policy_count INTEGER;
BEGIN
  -- Limpiar políticas de evento_imagenes
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'evento_imagenes'
  ) THEN
    -- Eliminar todas las políticas existentes
    FOR policy_rec IN 
      SELECT policyname FROM pg_policies 
      WHERE tablename = 'evento_imagenes'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON evento_imagenes', policy_rec.policyname);
      RAISE NOTICE 'Política % eliminada de evento_imagenes', policy_rec.policyname;
    END LOOP;
    
    -- Crear políticas limpias
    CREATE POLICY "Users can view event images" ON evento_imagenes
      FOR SELECT USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Users can insert event images" ON evento_imagenes
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Users can update event images" ON evento_imagenes
      FOR UPDATE USING (auth.uid() IS NOT NULL);
    
    RAISE NOTICE 'Políticas limpias creadas para evento_imagenes';
  END IF;

  -- Limpiar políticas de recinto_imagenes
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'recinto_imagenes'
  ) THEN
    -- Eliminar todas las políticas existentes
    FOR policy_rec IN 
      SELECT policyname FROM pg_policies 
      WHERE tablename = 'recinto_imagenes'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON recinto_imagenes', policy_rec.policyname);
      RAISE NOTICE 'Política % eliminada de recinto_imagenes', policy_rec.policyname;
    END LOOP;
    
    -- Crear políticas limpias
    CREATE POLICY "Users can view venue images" ON recinto_imagenes
      FOR SELECT USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Users can insert venue images" ON recinto_imagenes
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Users can update venue images" ON recinto_imagenes
      FOR UPDATE USING (auth.uid() IS NOT NULL);
    
    RAISE NOTICE 'Políticas limpias creadas para recinto_imagenes';
  END IF;
END $$;

-- 3. VERIFICAR QUE LAS POLÍTICAS ESTÁN LIMPIAS
SELECT 
  'evento_imagenes' as tabla,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'evento_imagenes'
UNION ALL
SELECT 
  'recinto_imagenes' as tabla,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'recinto_imagenes';

-- 4. VERIFICAR QUE RLS ESTÁ HABILITADO
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('evento_imagenes', 'recinto_imagenes');

-- 5. MENSAJE DE ÉXITO
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'LIMPIEZA DE POLÍTICAS COMPLETADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Políticas duplicadas eliminadas';
  RAISE NOTICE 'Políticas limpias creadas';
  RAISE NOTICE 'RLS verificado y habilitado';
  RAISE NOTICE '¡Sistema listo para usar!';
  RAISE NOTICE '========================================';
END $$;
