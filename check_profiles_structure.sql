-- 🔍 Verificar Estructura Real de Profiles
-- Este script verifica la estructura actual de la tabla profiles

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
-- VERIFICAR DATOS DE PROFILES
-- =====================================================

-- Mostrar algunos perfiles existentes (sin tenant_id)
SELECT 
    'PERFILES EXISTENTES' as tipo,
    id,
    email,
    nombre,
    apellido,
    telefono
FROM profiles 
LIMIT 5;

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
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto verificará la estructura real de profiles
3. Agregará la columna email si no existe

RESULTADO ESPERADO:
- Estructura real de la tabla profiles
- Columna email agregada si no existe
- Información sobre perfiles existentes
*/
