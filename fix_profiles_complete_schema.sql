-- 🔧 Fix Profiles Complete Schema
-- Este script verifica y agrega todas las columnas necesarias en profiles

-- =====================================================
-- VERIFICAR ESTRUCTURA ACTUAL DE PROFILES
-- =====================================================

-- Mostrar estructura actual de profiles
SELECT 
    'ESTRUCTURA ACTUAL PROFILES' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- AGREGAR COLUMNAS FALTANTES
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

-- Agregar columna metodospago si no existe (con minúscula)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'metodospago'
    ) THEN
        ALTER TABLE profiles ADD COLUMN metodospago JSONB DEFAULT '{"efectivo": false, "zelle": false, "pagoMovil": false, "paypal": false, "puntoVenta": false, "procesadorPago": false}'::jsonb;
        RAISE NOTICE 'Columna metodospago agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna metodospago ya existe en profiles';
    END IF;
END $$;

-- Agregar columna canales si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'canales'
    ) THEN
        ALTER TABLE profiles ADD COLUMN canales JSONB DEFAULT '{"test": false, "internet": false, "boxOffice": false, "marcaBlanca": false}'::jsonb;
        RAISE NOTICE 'Columna canales agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna canales ya existe en profiles';
    END IF;
END $$;

-- Agregar columna permisos si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'permisos'
    ) THEN
        ALTER TABLE profiles ADD COLUMN permisos JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Columna permisos agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna permisos ya existe en profiles';
    END IF;
END $$;

-- Agregar columna recintos si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'recintos'
    ) THEN
        ALTER TABLE profiles ADD COLUMN recintos UUID[] DEFAULT '{}'::uuid[];
        RAISE NOTICE 'Columna recintos agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna recintos ya existe en profiles';
    END IF;
END $$;

-- Agregar columna perfil si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'perfil'
    ) THEN
        ALTER TABLE profiles ADD COLUMN perfil TEXT;
        RAISE NOTICE 'Columna perfil agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna perfil ya existe en profiles';
    END IF;
END $$;

-- Agregar columna activo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'activo'
    ) THEN
        ALTER TABLE profiles ADD COLUMN activo BOOLEAN DEFAULT true;
        RAISE NOTICE 'Columna activo agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna activo ya existe en profiles';
    END IF;
END $$;

-- Agregar columna nombre si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'nombre'
    ) THEN
        ALTER TABLE profiles ADD COLUMN nombre VARCHAR(255);
        RAISE NOTICE 'Columna nombre agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna nombre ya existe en profiles';
    END IF;
END $$;

-- Agregar columna apellido si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'apellido'
    ) THEN
        ALTER TABLE profiles ADD COLUMN apellido VARCHAR(255);
        RAISE NOTICE 'Columna apellido agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna apellido ya existe en profiles';
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
-- VERIFICAR DATOS DE PROFILES
-- =====================================================

-- Mostrar algunos perfiles existentes
SELECT 
    'PERFILES EXISTENTES' as tipo,
    id,
    nombre,
    apellido,
    email,
    telefono,
    perfil,
    activo
FROM profiles 
LIMIT 5;

-- =====================================================
-- VERIFICAR COLUMNAS JSONB
-- =====================================================

-- Verificar columnas JSONB
SELECT 
    'COLUMNAS JSONB' as tipo,
    id,
    canales,
    permisos,
    metodospago,
    recintos
FROM profiles 
LIMIT 3;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto agregará todas las columnas faltantes en profiles
3. Verificará que la estructura sea correcta
4. Mostrará datos de ejemplo

RESULTADO ESPERADO:
- Todas las columnas necesarias agregadas a profiles
- Estructura final verificada
- Datos de ejemplo mostrados
- Columnas JSONB funcionando correctamente
*/
