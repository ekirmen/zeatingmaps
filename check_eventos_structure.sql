-- 🚀 Verificar estructura de la tabla eventos
-- Este script muestra las columnas actuales de la tabla eventos

-- =====================================================
-- VERIFICAR ESTRUCTURA DE EVENTOS
-- =====================================================

-- Mostrar todas las columnas de la tabla eventos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'eventos' 
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR ESTRUCTURA DE RECINTOS
-- =====================================================

-- Mostrar todas las columnas de la tabla recintos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'recintos' 
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR ESTRUCTURA DE TENANTS
-- =====================================================

-- Mostrar todas las columnas de la tabla tenants
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR DATOS EXISTENTES
-- =====================================================

-- Contar registros en cada tabla
SELECT 'eventos' as tabla, COUNT(*) as total FROM eventos
UNION ALL
SELECT 'recintos' as tabla, COUNT(*) as total FROM recintos
UNION ALL
SELECT 'tenants' as tabla, COUNT(*) as total FROM tenants;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto mostrará la estructura actual de las tablas
3. Usa esta información para ajustar los scripts de inserción

RESULTADO ESPERADO:
- Verás las columnas exactas de cada tabla
- Podrás ajustar los scripts de inserción según la estructura real
*/
