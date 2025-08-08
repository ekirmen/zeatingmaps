-- 🚀 Verificación Simple de Funciones
-- Este script verifica las funciones de manera directa

-- =====================================================
-- VERIFICAR FUNCIONES EXISTENTES
-- =====================================================

-- Contar todas las funciones del tenant
SELECT 
    'CONTEO TOTAL' as tipo,
    COUNT(*) as total_funciones
FROM funciones 
WHERE tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc';

-- =====================================================
-- VERIFICAR FUNCIONES POR EVENTO
-- =====================================================

-- Funciones del evento 1
SELECT 
    'EVENTO 1 FUNCIONES' as tipo,
    COUNT(*) as total_funciones
FROM funciones 
WHERE evento = '5985277e-df15-45ec-bab7-751063f5251c'
AND tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc';

-- Funciones del evento 2
SELECT 
    'EVENTO 2 FUNCIONES' as tipo,
    COUNT(*) as total_funciones
FROM funciones 
WHERE evento = 'c84baabd-c424-407f-b6c3-2051062237b7'
AND tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc';

-- =====================================================
-- MOSTRAR FUNCIONES DETALLADAS
-- =====================================================

-- Mostrar todas las funciones del tenant
SELECT 
    'FUNCIONES DETALLADAS' as tipo,
    f.id,
    f.evento,
    f.tenant_id,
    f.fecha_celebracion,
    f.sala,
    e.nombre as evento_nombre
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
WHERE f.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY f.fecha_celebracion;

-- =====================================================
-- VERIFICAR EVENTOS
-- =====================================================

-- Mostrar eventos del tenant
SELECT 
    'EVENTOS DEL TENANT' as tipo,
    e.id,
    e.nombre,
    e.tenant_id,
    COUNT(f.id) as total_funciones
FROM eventos e
LEFT JOIN funciones f ON e.id = f.evento
WHERE e.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
GROUP BY e.id, e.nombre, e.tenant_id
ORDER BY e.nombre;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto te mostrará exactamente cuántas funciones hay
3. Compara con los logs del frontend

RESULTADO ESPERADO:
- Deberías ver 2 funciones en total
- Cada evento debería tener sus funciones
- Si no hay funciones, necesitamos crearlas
*/
