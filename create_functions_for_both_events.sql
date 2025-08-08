-- 🚀 Crear Funciones para Ambos Eventos
-- Este script crea funciones para los dos eventos existentes

-- =====================================================
-- VERIFICAR SALAS DISPONIBLES
-- =====================================================

-- Mostrar salas del tenant
SELECT 
    'SALAS DISPONIBLES' as tipo,
    s.id,
    s.nombre,
    s.capacidad,
    s.tenant_id
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY s.nombre;

-- =====================================================
-- CREAR FUNCIONES PARA EVENTO 1
-- =====================================================

-- Crear función para "Evento de Prueba ZeatingMaps"
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

-- Crear función adicional para "Evento de Prueba ZeatingMaps"
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
-- CREAR FUNCIONES PARA EVENTO 2
-- =====================================================

-- Crear función para "ORLANDO LEGENDS RESTO & LOUNGE"
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
    '5985277e-df15-45ec-bab7-751063f5251c' as evento,
    s.id as sala,
    CURRENT_DATE + INTERVAL '15 days' as fecha_celebracion,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id,
    CURRENT_DATE as inicio_venta,
    CURRENT_DATE + INTERVAL '14 days' as fin_venta,
    false as pago_a_plazos,
    true as permitir_reservas_web,
    -120 as tiempo_caducidad_reservas
FROM salas s
WHERE s.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND s.nombre = 'Sala Principal'
AND NOT EXISTS (
    SELECT 1 FROM funciones f 
    WHERE f.evento = '5985277e-df15-45ec-bab7-751063f5251c' 
    AND f.sala = s.id
);

-- =====================================================
-- VERIFICAR FUNCIONES CREADAS
-- =====================================================

-- Mostrar todas las funciones del tenant
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
WHERE f.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY f.fecha_celebracion;

-- =====================================================
-- VERIFICAR CONTEO FINAL
-- =====================================================

-- Contar funciones por evento
SELECT 
    'CONTEO FINAL' as tipo,
    e.nombre as evento_nombre,
    COUNT(f.id) as total_funciones
FROM eventos e
LEFT JOIN funciones f ON e.id = f.evento AND f.tenant_id = e.tenant_id
WHERE e.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
GROUP BY e.id, e.nombre
ORDER BY e.nombre;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará funciones para ambos eventos existentes
3. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- Evento 1: 2 funciones
- Evento 2: 1 función
- Total: 3 funciones
- Las funciones deberían aparecer en el store
*/
