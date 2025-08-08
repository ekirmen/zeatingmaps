-- 🚀 Crear Funciones para el Evento Específico
-- Este script crea funciones para el evento c84baabd-c424-407f-b6c3-2051062237b7

-- =====================================================
-- VERIFICAR SALAS DISPONIBLES
-- =====================================================

-- Mostrar salas del tenant
SELECT 
    'SALAS DISPONIBLES' as tipo,
    s.id,
    s.nombre,
    s.tenant_id
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY s.nombre;

-- =====================================================
-- CREAR FUNCIONES DE EJEMPLO
-- =====================================================

-- Crear función principal
INSERT INTO funciones (evento, sala, fecha_celebracion, tenant_id)
SELECT 
    'c84baabd-c424-407f-b6c3-2051062237b7' as evento,
    s.id as sala,
    CURRENT_DATE + INTERVAL '30 days' as fecha_celebracion,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
LIMIT 1;

-- Crear función adicional
INSERT INTO funciones (evento, sala, fecha_celebracion, tenant_id)
SELECT 
    'c84baabd-c424-407f-b6c3-2051062237b7' as evento,
    s.id as sala,
    CURRENT_DATE + INTERVAL '45 days' as fecha_celebracion,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
LIMIT 1;

-- =====================================================
-- VERIFICAR FUNCIONES CREADAS
-- =====================================================

-- Mostrar funciones creadas
SELECT 
    'FUNCIONES CREADAS' as tipo,
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
-- VERIFICAR CONTEO FINAL
-- =====================================================

-- Contar funciones del evento
SELECT 
    'CONTEO FINAL' as tipo,
    COUNT(*) as total_funciones,
    COUNT(CASE WHEN tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc' THEN 1 END) as funciones_correctas
FROM funciones 
WHERE evento = 'c84baabd-c424-407f-b6c3-2051062237b7';

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará 2 funciones para el evento específico
3. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- El evento debe tener 2 funciones
- Las funciones deben tener el tenant_id correcto
- Las funciones deberían aparecer en el store
*/
