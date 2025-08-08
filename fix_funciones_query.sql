-- 🚀 Arreglar Consultas de Funciones
-- Este script verifica y arregla las inconsistencias en las consultas

-- =====================================================
-- VERIFICAR ESTRUCTURA REAL DE FUNCIONES
-- =====================================================

-- Mostrar estructura completa
SELECT 
    'ESTRUCTURA COMPLETA' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'funciones' 
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR DATOS REALES
-- =====================================================

-- Mostrar datos reales de funciones
SELECT 
    'DATOS REALES' as tipo,
    id,
    fecha,
    hora,
    evento_id,
    sala_id
FROM funciones 
LIMIT 10;

-- =====================================================
-- VERIFICAR RELACIONES
-- =====================================================

-- Verificar que las relaciones funcionen
SELECT 
    'RELACIONES' as tipo,
    f.id,
    f.fecha,
    f.hora,
    f.evento_id,
    f.sala_id,
    e.nombre as evento_nombre,
    s.nombre as sala_nombre
FROM funciones f
LEFT JOIN eventos e ON f.evento_id = e.id
LEFT JOIN salas s ON f.sala_id = s.id
LIMIT 5;

-- =====================================================
-- VERIFICAR TENANT_ID
-- =====================================================

-- Verificar si funciones tiene tenant_id
SELECT 
    'TENANT CHECK' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'funciones' AND column_name = 'tenant_id'
        ) THEN 'Tiene tenant_id'
        ELSE 'No tiene tenant_id'
    END as resultado;

-- =====================================================
-- VERIFICAR RLS
-- =====================================================

-- Verificar políticas RLS para funciones
SELECT 
    'RLS FUNCIONES' as tipo,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'funciones';

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto te mostrará la estructura real de funciones
3. Usa esta información para arreglar las consultas

PROBLEMAS IDENTIFICADOS:
- El código usa 'fecha_celebracion' pero la tabla tiene 'fecha' y 'hora'
- Posibles problemas con RLS o tenant_id
- Relaciones faltantes entre tablas
*/
