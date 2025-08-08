-- 🚀 Crear Salas y Funciones para el Evento
-- Este script crea salas y funciones para el evento c84baabd-c424-407f-b6c3-2051062237b7

-- =====================================================
-- VERIFICAR RECINTOS DISPONIBLES
-- =====================================================

-- Mostrar recintos del tenant
SELECT 
    'RECINTOS DISPONIBLES' as tipo,
    r.id,
    r.nombre,
    r.tenant_id
FROM recintos r
WHERE r.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY r.nombre;

-- =====================================================
-- CREAR RECINTO SI NO EXISTE
-- =====================================================

-- Crear recinto si no existe
INSERT INTO recintos (nombre, capacidad, tenant_id)
SELECT 
    'Estadio de Prueba ZeatingMaps',
    2000,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
WHERE NOT EXISTS (
    SELECT 1 FROM recintos r 
    WHERE r.nombre = 'Estadio de Prueba ZeatingMaps'
    AND r.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
);

-- =====================================================
-- CREAR SALAS PARA EL RECINTO
-- =====================================================

-- Crear sala principal
INSERT INTO salas (nombre, capacidad, recinto_id, tenant_id)
SELECT 
    'Sala Principal',
    1000,
    r.id,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
FROM recintos r
WHERE r.nombre = 'Estadio de Prueba ZeatingMaps'
AND r.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND NOT EXISTS (
    SELECT 1 FROM salas s 
    WHERE s.nombre = 'Sala Principal'
    AND s.recinto_id = r.id
);

-- Crear sala secundaria
INSERT INTO salas (nombre, capacidad, recinto_id, tenant_id)
SELECT 
    'Sala VIP',
    500,
    r.id,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
FROM recintos r
WHERE r.nombre = 'Estadio de Prueba ZeatingMaps'
AND r.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND NOT EXISTS (
    SELECT 1 FROM salas s 
    WHERE s.nombre = 'Sala VIP'
    AND s.recinto_id = r.id
);

-- =====================================================
-- VERIFICAR SALAS CREADAS
-- =====================================================

-- Mostrar salas del tenant
SELECT 
    'SALAS CREADAS' as tipo,
    s.id,
    s.nombre,
    s.capacidad,
    s.tenant_id,
    r.nombre as recinto_nombre
FROM salas s
LEFT JOIN recintos r ON s.recinto_id = r.id
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY s.nombre;

-- =====================================================
-- CREAR FUNCIONES PARA EL EVENTO
-- =====================================================

-- Crear función principal
INSERT INTO funciones (
    evento, 
    sala, 
    fecha_celebracion, 
    tenant_id,
    inicio_venta,
    fin_venta,
    pago_a_plazos,
    permitir_reservas_web,
    tiempo_caducidad_reservas
)
SELECT 
    'c84baabd-c424-407f-b6c3-2051062237b7' as evento,
    s.id as sala,
    CURRENT_DATE + INTERVAL '30 days' as fecha_celebracion,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id,
    CURRENT_DATE as inicio_venta,
    CURRENT_DATE + INTERVAL '29 days' as fin_venta,
    false as pago_a_plazos,
    true as permitir_reservas_web,
    -120 as tiempo_caducidad_reservas
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND s.nombre = 'Sala Principal'
AND NOT EXISTS (
    SELECT 1 FROM funciones f 
    WHERE f.evento = 'c84baabd-c424-407f-b6c3-2051062237b7' 
    AND f.sala = s.id
);

-- Crear función VIP
INSERT INTO funciones (
    evento, 
    sala, 
    fecha_celebracion, 
    tenant_id,
    inicio_venta,
    fin_venta,
    pago_a_plazos,
    permitir_reservas_web,
    tiempo_caducidad_reservas
)
SELECT 
    'c84baabd-c424-407f-b6c3-2051062237b7' as evento,
    s.id as sala,
    CURRENT_DATE + INTERVAL '45 days' as fecha_celebracion,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id,
    CURRENT_DATE as inicio_venta,
    CURRENT_DATE + INTERVAL '44 days' as fin_venta,
    false as pago_a_plazos,
    true as permitir_reservas_web,
    -120 as tiempo_caducidad_reservas
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND s.nombre = 'Sala VIP'
AND NOT EXISTS (
    SELECT 1 FROM funciones f 
    WHERE f.evento = 'c84baabd-c424-407f-b6c3-2051062237b7' 
    AND f.sala = s.id
);

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
2. Esto creará recintos, salas y funciones para el evento
3. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- Debe haber 1 recinto
- Debe haber 2 salas
- El evento debe tener 2 funciones
- Las funciones deberían aparecer en el store
*/
