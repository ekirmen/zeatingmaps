-- 🔧 Arreglar Estructura de Profiles
-- Este script verifica y arregla la tabla profiles

-- =====================================================
-- VERIFICAR ESTRUCTURA DE PROFILES
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
    END IF;
END $$;

-- =====================================================
-- VERIFICAR COLUMNAS OBLIGATORIAS
-- =====================================================

-- Verificar si existen columnas básicas
DO $$ 
BEGIN
    -- Agregar nombre si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'nombre'
    ) THEN
        ALTER TABLE profiles ADD COLUMN nombre VARCHAR(255);
    END IF;
    
    -- Agregar apellido si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'apellido'
    ) THEN
        ALTER TABLE profiles ADD COLUMN apellido VARCHAR(255);
    END IF;
    
    -- Agregar telefono si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'telefono'
    ) THEN
        ALTER TABLE profiles ADD COLUMN telefono VARCHAR(20);
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
    email,
    nombre,
    apellido,
    telefono,
    tenant_id
FROM profiles 
WHERE tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
LIMIT 5;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto agregará las columnas faltantes a profiles
3. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- Columna email agregada a profiles
- Otras columnas básicas agregadas si faltan
- El error de actualización de perfil debería resolverse
*/
