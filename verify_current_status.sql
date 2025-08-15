-- =====================================================
-- VERIFICAR ESTADO ACTUAL DEL SISTEMA
-- =====================================================

-- 1. VERIFICAR TABLAS EXISTENTES
SELECT 
  'Tablas de imágenes' as tipo,
  table_name,
  'EXISTE' as estado
FROM information_schema.tables 
WHERE table_name IN ('evento_imagenes', 'recinto_imagenes')
  AND table_schema = 'public';

-- 2. VERIFICAR ESTRUCTURA DE LAS TABLAS
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('evento_imagenes', 'recinto_imagenes')
ORDER BY table_name, ordinal_position;

-- 3. VERIFICAR POLÍTICAS RLS EXISTENTES
SELECT 
  'Políticas RLS' as tipo,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename IN ('evento_imagenes', 'recinto_imagenes')
ORDER BY tablename, policyname;

-- 4. VERIFICAR RLS HABILITADO
SELECT 
  'RLS Status' as tipo,
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'HABILITADO'
    ELSE 'DESHABILITADO'
  END as estado_rls
FROM pg_tables 
WHERE tablename IN ('evento_imagenes', 'recinto_imagenes');

-- 5. VERIFICAR TRIGGERS
SELECT 
  'Triggers' as tipo,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgtype,
  tgenabled
FROM pg_trigger 
WHERE tgrelid::regclass::text IN ('evento_imagenes', 'recinto_imagenes');

-- 6. VERIFICAR FUNCIONES
SELECT 
  'Funciones' as tipo,
  routine_name,
  routine_type,
  'EXISTE' as estado
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column';

-- 7. VERIFICAR FOREIGN KEYS
SELECT 
  'Foreign Keys' as tipo,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('evento_imagenes', 'recinto_imagenes');

-- 8. VERIFICAR ÍNDICES
SELECT 
  'Índices' as tipo,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('evento_imagenes', 'recinto_imagenes')
ORDER BY tablename, indexname;

-- 9. RESUMEN DEL ESTADO
DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Contar tablas
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_name IN ('evento_imagenes', 'recinto_imagenes')
    AND table_schema = 'public';
  
  -- Contar políticas
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename IN ('evento_imagenes', 'recinto_imagenes');
  
  -- Contar triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger 
  WHERE tgrelid::regclass::text IN ('evento_imagenes', 'recinto_imagenes');
  
  -- Contar funciones
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines 
  WHERE routine_name = 'update_updated_at_column';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ESTADO ACTUAL DEL SISTEMA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tablas de imágenes: %', table_count;
  RAISE NOTICE 'Políticas RLS: %', policy_count;
  RAISE NOTICE 'Triggers: %', trigger_count;
  RAISE NOTICE 'Funciones: %', function_count;
  
  IF table_count = 2 AND policy_count >= 6 AND trigger_count = 2 AND function_count = 1 THEN
    RAISE NOTICE '✅ SISTEMA COMPLETAMENTE CONFIGURADO';
    RAISE NOTICE '¡Puedes proceder a usar el sistema!';
  ELSIF table_count = 2 THEN
    RAISE NOTICE '⚠️ TABLAS CREADAS PERO FALTAN ELEMENTOS';
    RAISE NOTICE 'Ejecuta create_image_tables.sql para completar';
  ELSE
    RAISE NOTICE '❌ SISTEMA INCOMPLETO';
    RAISE NOTICE 'Sigue los pasos de instalación';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
