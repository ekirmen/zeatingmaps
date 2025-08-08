-- 🚀 Verificar Funciones del Evento Específico
-- Este script verifica las funciones del evento c84baabd-c424-407f-b6c3-2051062237b7

-- =====================================================
-- VERIFICAR FUNCIONES DEL EVENTO ESPECÍFICO
-- =====================================================

-- Mostrar todas las funciones del evento
SELECT 
    'FUNCIONES DEL EVENTO' as tipo,
    f.id,
    f.evento,
    f.tenant_id,
    f.fecha_celebracion,
    f.sala,
    e.nombre as evento_nombre,
    s.nombre as sala_nombre
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LEFT JOIN salas s ON f.sala = s.id
WHERE f.evento = 'c84baabd-c424-407f-b6c3-2051062237b7'
ORDER BY f.fecha_celebracion;

-- =====================================================
-- VERIFICAR SI EXISTEN FUNCIONES
-- =====================================================

-- Contar funciones del evento
SELECT 
    'CONTEO FUNCIONES' as tipo,
    COUNT(*) as total_funciones,
    COUNT(CASE WHEN tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc' THEN 1 END) as funciones_correctas,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as funciones_con_null,
    COUNT(CASE WHEN tenant_id != '2b86dc35-49ad-43ea-a50d-a14c55a327cc' AND tenant_id IS NOT NULL THEN 1 END) as funciones_incorrectas
FROM funciones 
WHERE evento = 'c84baabd-c424-407f-b6c3-2051062237b7';

-- =====================================================
-- CORREGIR FUNCIONES DEL EVENTO ESPECÍFICO
-- =====================================================

-- Actualizar funciones del evento para usar el tenant correcto
UPDATE funciones 
SET tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
WHERE evento = 'c84baabd-c424-407f-b6c3-2051062237b7'
AND (tenant_id IS NULL OR tenant_id != '2b86dc35-49ad-43ea-a50d-a14c55a327cc');

-- =====================================================
-- VERIFICAR CORRECCIÓN
-- =====================================================

-- Verificar que las funciones ahora tienen el tenant correcto
SELECT 
    'FUNCIONES CORREGIDAS' as tipo,
    f.id,
    f.evento,
    f.tenant_id,
    f.fecha_celebracion,
    e.nombre as evento_nombre,
    s.nombre as sala_nombre
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LEFT JOIN salas s ON f.sala = s.id
WHERE f.evento = 'c84baabd-c424-407f-b6c3-2051062237b7'
AND f.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY f.fecha_celebracion;

-- =====================================================
-- CREAR FUNCIONES SI NO EXISTEN
-- =====================================================

-- Verificar si hay salas disponibles para crear funciones
SELECT 
    'SALAS DISPONIBLES' as tipo,
    s.id,
    s.nombre,
    s.recinto_id,
    r.nombre as recinto_nombre
FROM salas s
LEFT JOIN recintos r ON s.recinto_id = r.id
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY s.nombre;

-- Crear funciones de ejemplo si no existen
INSERT INTO funciones (evento, sala, fecha_celebracion, tenant_id)
SELECT 
    'c84baabd-c424-407f-b6c3-2051062237b7' as evento,
    s.id as sala,
    CURRENT_DATE + INTERVAL '30 days' as fecha_celebracion,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND NOT EXISTS (
    SELECT 1 FROM funciones f 
    WHERE f.evento = 'c84baabd-c424-407f-b6c3-2051062237b7' 
    AND f.sala = s.id
)
LIMIT 2;

-- =====================================================
-- VERIFICAR RESULTADO FINAL
-- =====================================================

-- Verificar todas las funciones del evento después de las correcciones
SELECT 
    'RESULTADO FINAL' as tipo,
    f.id,
    f.evento,
    f.tenant_id,
    f.fecha_celebracion,
    e.nombre as evento_nombre,
    s.nombre as sala_nombre,
    COUNT(*) OVER() as total_funciones
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LEFT JOIN salas s ON f.sala = s.id
WHERE f.evento = 'c84baabd-c424-407f-b6c3-2051062237b7'
AND f.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY f.fecha_celebracion;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto verificará y corregirá las funciones del evento específico
3. Si no hay funciones, creará algunas de ejemplo
4. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- El evento debe tener al menos 1 función
- Las funciones deben tener el tenant_id correcto
- Las funciones deberían aparecer en el store
*/
