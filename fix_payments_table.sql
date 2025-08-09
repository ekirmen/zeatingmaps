-- 🔧 Script para verificar y corregir la tabla payments
-- =====================================================

-- Verificar estructura actual de la tabla payments
SELECT 'ESTRUCTURA ACTUAL PAYMENTS' as tipo, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Verificar si existe la columna user_id
SELECT 'COLUMNA USER_ID' as tipo, 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'user_id'
  ) THEN '✅ Existe' ELSE '❌ No existe' END as estado_user_id;

-- Agregar columna user_id si no existe
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'user_id'
  ) THEN 
    ALTER TABLE payments ADD COLUMN user_id UUID;
    RAISE NOTICE 'Columna user_id agregada a payments';
  ELSE 
    RAISE NOTICE 'Columna user_id ya existe en payments';
  END IF;
END $$;

-- Verificar estructura final
SELECT 'ESTRUCTURA FINAL PAYMENTS' as tipo, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Mostrar algunos registros de payments para verificar
SELECT 'MUESTRA PAYMENTS' as tipo, id, user_id, event, funcion, status, created_at 
FROM payments 
LIMIT 5;

-- =====================================================
-- COMENTARIOS:
-- 1. Ejecuta este script en el SQL Editor de Supabase
-- 2. Esto verificará la estructura actual de payments
-- 3. Agregará la columna user_id si no existe
-- 4. Mostrará una muestra de los datos existentes
-- =====================================================
