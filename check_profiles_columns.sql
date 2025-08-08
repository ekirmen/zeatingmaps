-- 🔍 Verificar Columnas de Profiles
-- Este script verifica exactamente qué columnas existen en la tabla profiles

-- =====================================================
-- VERIFICAR ESTRUCTURA EXACTA DE PROFILES
-- =====================================================

-- Mostrar todas las columnas de profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR COLUMNAS JSONB ESPECÍFICAS
-- =====================================================

-- Verificar si existe metodospago (con minúscula)
SELECT 
    'metodospago' as columna_buscada,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'metodospago'
        ) THEN '✅ Existe'
        ELSE '❌ No existe'
    END as estado;

-- Verificar si existe metodosPago (con mayúscula)
SELECT 
    'metodosPago' as columna_buscada,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'metodosPago'
        ) THEN '✅ Existe'
        ELSE '❌ No existe'
    END as estado;

-- Verificar si existe metodospago (con minúscula)
SELECT 
    'metodospago' as columna_buscada,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'metodospago'
        ) THEN '✅ Existe'
        ELSE '❌ No existe'
    END as estado;

-- =====================================================
-- VERIFICAR DATOS DE EJEMPLO
-- =====================================================

-- Mostrar algunos registros con las columnas JSONB
SELECT 
    id,
    nombre,
    canales,
    permisos,
    metodospago,
    recintos
FROM profiles 
LIMIT 3;

-- =====================================================
-- VERIFICAR TIPOS DE DATOS
-- =====================================================

-- Verificar tipos de datos de las columnas JSONB
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND data_type = 'USER-DEFINED'
ORDER BY ordinal_position;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto mostrará exactamente qué columnas existen
3. Verificará si las columnas JSONB están correctas
4. Mostrará datos de ejemplo

RESULTADO ESPERADO:
- Lista completa de columnas en profiles
- Verificación de columnas JSONB
- Datos de ejemplo mostrados
- Tipos de datos correctos
*/
