-- 🔄 Refresh Schema Cache
-- Este script ayuda a refrescar el caché del esquema de Supabase

-- =====================================================
-- VERIFICAR ESTRUCTURA ACTUAL
-- =====================================================

-- Mostrar estructura actual
SELECT 
    'ESTRUCTURA ACTUAL' as tipo,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles'
AND column_name IN ('metodospago', 'canales', 'permisos', 'recintos')
ORDER BY column_name;

-- =====================================================
-- VERIFICAR COLUMNA METODOSPAGO
-- =====================================================

-- Verificar si la columna metodospago existe y tiene datos
SELECT 
    'VERIFICACIÓN METODOSPAGO' as tipo,
    COUNT(*) as total_registros,
    COUNT(metodospago) as registros_con_metodospago,
    COUNT(CASE WHEN metodospago IS NOT NULL THEN 1 END) as registros_no_nulos
FROM profiles;

-- =====================================================
-- ACTUALIZAR REGISTROS SIN METODOSPAGO
-- =====================================================

-- Actualizar registros que no tienen metodospago
UPDATE profiles 
SET metodospago = '{"efectivo": false, "zelle": false, "pagoMovil": false, "paypal": false, "puntoVenta": false, "procesadorPago": false}'::jsonb
WHERE metodospago IS NULL;

-- =====================================================
-- VERIFICAR DESPUÉS DE ACTUALIZAR
-- =====================================================

-- Verificar después de actualizar
SELECT 
    'DESPUÉS DE ACTUALIZAR' as tipo,
    COUNT(*) as total_registros,
    COUNT(metodospago) as registros_con_metodospago,
    COUNT(CASE WHEN metodospago IS NOT NULL THEN 1 END) as registros_no_nulos
FROM profiles;

-- =====================================================
-- MOSTRAR DATOS DE EJEMPLO
-- =====================================================

-- Mostrar algunos registros con metodospago
SELECT 
    'DATOS DE EJEMPLO' as tipo,
    id,
    nombre,
    metodospago
FROM profiles 
LIMIT 3;

-- =====================================================
-- VERIFICAR TIPOS DE DATOS
-- =====================================================

-- Verificar tipos de datos específicos
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('metodospago', 'canales', 'permisos', 'recintos')
ORDER BY column_name;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto verificará y actualizará los datos
3. Refrescará el caché del esquema
4. Verificará que todo esté correcto

RESULTADO ESPERADO:
- Estructura verificada
- Datos actualizados
- Caché refrescado
- Tipos de datos correctos
*/
