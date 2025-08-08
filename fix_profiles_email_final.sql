-- 🔧 Fix Profiles Email Column
-- Este script corrige la estructura de profiles agregando la columna email

-- =====================================================
-- VERIFICAR ESTRUCTURA ACTUAL DE PROFILES
-- =====================================================

-- Mostrar estructura actual de profiles
SELECT 
    'ESTRUCTURA PROFILES' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR SI EXISTE COLUMNA EMAIL
-- =====================================================

-- Verificar si existe la columna email
SELECT 
    'COLUMNA EMAIL' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'email'
        ) THEN '✅ Existe'
        ELSE '❌ No existe'
    END as estado_email;

-- =====================================================
-- AGREGAR COLUMNA EMAIL SI NO EXISTE
-- =====================================================

-- Agregar columna email si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'Columna email agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna email ya existe en profiles';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR DATOS DE PROFILES (SIN EMAIL)
-- =====================================================

-- Mostrar algunos perfiles existentes (sin email para evitar errores)
SELECT 
    'PERFILES EXISTENTES' as tipo,
    id,
    nombre,
    apellido,
    telefono,
    full_name
FROM profiles 
LIMIT 5;

-- =====================================================
-- VERIFICAR ESTRUCTURA FINAL
-- =====================================================

-- Mostrar estructura final de profiles
SELECT 
    'ESTRUCTURA FINAL PROFILES' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR EMAIL DESPUÉS DE AGREGAR
-- =====================================================

-- Verificar si ahora existe la columna email
SELECT 
    'VERIFICACIÓN FINAL EMAIL' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'email'
        ) THEN '✅ Columna email disponible'
        ELSE '❌ Columna email no disponible'
    END as estado_final_email;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto verificará la estructura real de profiles
3. Agregará la columna email si no existe
4. Evita errores de columnas inexistentes

RESULTADO ESPERADO:
- Estructura real de la tabla profiles
- Columna email agregada si no existe
- Información sobre perfiles existentes (sin email)
- Verificación final de la columna email
*/
