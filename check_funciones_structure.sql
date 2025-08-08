-- 🚀 Verificar estructura de la tabla funciones
-- Este script muestra las columnas reales de la tabla funciones

-- =====================================================
-- VERIFICAR ESTRUCTURA DE FUNCIONES
-- =====================================================

-- Mostrar todas las columnas de la tabla funciones
SELECT 
    'FUNCIONES' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'funciones' 
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR DATOS EXISTENTES
-- =====================================================

-- Contar funciones existentes
SELECT 
    'FUNCIONES EXISTENTES' as tipo,
    COUNT(*) as total
FROM funciones;

-- Mostrar algunas funciones si existen
SELECT 
    'MUESTRA FUNCIONES' as tipo,
    *
FROM funciones 
LIMIT 5;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto mostrará la estructura real de la tabla funciones
3. Usa esta información para ajustar el script de creación

RESULTADO ESPERADO:
- Verás las columnas exactas de la tabla funciones
- Podrás ajustar el script de creación según la estructura real
*/
