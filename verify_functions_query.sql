-- 🚀 Verificar Consulta de Funciones
-- Este script verifica exactamente qué está pasando con las funciones

-- =====================================================
-- VERIFICAR FUNCIONES EXISTENTES
-- =====================================================

-- Mostrar todas las funciones del tenant
SELECT 
    'TODAS LAS FUNCIONES' as tipo,
    f.id,
    f.evento,
    f.tenant_id,
    f.fecha_celebracion,
    e.nombre as evento_nombre,
    s.nombre as sala_nombre
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LEFT JOIN salas s ON f.sala = s.id
WHERE f.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY f.fecha_celebracion;

-- =====================================================
-- VERIFICAR EVENTOS ESPECÍFICOS
-- =====================================================

-- Verificar evento 1
SELECT 
    'EVENTO 1' as tipo,
    e.id,
    e.nombre,
    e.tenant_id,
    COUNT(f.id) as total_funciones
FROM eventos e
LEFT JOIN funciones f ON e.id = f.evento AND f.tenant_id = e.tenant_id
WHERE e.id = '5985277e-df15-45ec-bab7-751063f5251c'
GROUP BY e.id, e.nombre, e.tenant_id;

-- Verificar evento 2
SELECT 
    'EVENTO 2' as tipo,
    e.id,
    e.nombre,
    e.tenant_id,
    COUNT(f.id) as total_funciones
FROM eventos e
LEFT JOIN funciones f ON e.id = f.evento AND f.tenant_id = e.tenant_id
WHERE e.id = 'c84baabd-c424-407f-b6c3-2051062237b7'
GROUP BY e.id, e.nombre, e.tenant_id;

-- =====================================================
-- SIMULAR CONSULTA DEL FRONTEND
-- =====================================================

-- Simular la consulta exacta del frontend para evento 1
SELECT 
    'CONSULTA FRONTEND EVENTO 1' as tipo,
    f.id,
    f.fecha_celebracion,
    f.evento,
    f.sala,
    f.tenant_id
FROM funciones f
WHERE f.evento = '5985277e-df15-45ec-bab7-751063f5251c'
AND f.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY f.fecha_celebracion;

-- Simular la consulta exacta del frontend para evento 2
SELECT 
    'CONSULTA FRONTEND EVENTO 2' as tipo,
    f.id,
    f.fecha_celebracion,
    f.evento,
    f.sala,
    f.tenant_id
FROM funciones f
WHERE f.evento = 'c84baabd-c424-407f-b6c3-2051062237b7'
AND f.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY f.fecha_celebracion;

-- =====================================================
-- VERIFICAR ESTRUCTURA DE FUNCIONES
-- =====================================================

-- Mostrar estructura de la tabla funciones
SELECT 
    'ESTRUCTURA FUNCIONES' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'funciones' 
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR POLÍTICAS RLS
-- =====================================================

-- Mostrar políticas RLS para funciones
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
2. Esto te mostrará exactamente qué está pasando con las funciones
3. Compara los resultados con los logs del frontend

RESULTADO ESPERADO:
- Deberías ver las funciones creadas en "TODAS LAS FUNCIONES"
- Las consultas del frontend deberían mostrar las funciones
- Si no aparecen, puede ser un problema de RLS o estructura
*/
