-- Script para insertar eventos de ejemplo
-- =====================================================

-- Primero, verificar si hay recintos y salas disponibles
SELECT 
    'VERIFICACIÓN PREVIA' as categoria,
    'recintos' as tabla,
    COUNT(*) as total
FROM recintos
UNION ALL
SELECT 
    'VERIFICACIÓN PREVIA' as categoria,
    'salas' as tabla,
    COUNT(*) as total
FROM salas;

-- Insertar eventos de ejemplo (solo si hay recintos y salas)
INSERT INTO eventos (
    nombre,
    descripcion,
    recinto,
    sala,
    activo,
    sector,
    estadoVenta,
    descripcionEstado,
    estadoPersonalizado,
    mostrarDatosComprador,
    mostrarDatosBoleto,
    datosComprador,
    datosBoleto,
    otrasOpciones,
    analytics,
    imagenes,
    tags,
    configuracion
) 
SELECT 
    'Concierto de Rock' as nombre,
    'Un increíble concierto de rock con las mejores bandas' as descripcion,
    r.id as recinto,
    s.id as sala,
    true as activo,
    'General' as sector,
    'a-la-venta' as estadoVenta,
    'Disponible' as descripcionEstado,
    false as estadoPersonalizado,
    false as mostrarDatosComprador,
    false as mostrarDatosBoleto,
    '{}'::jsonb as datosComprador,
    '{}'::jsonb as datosBoleto,
    '{}'::jsonb as otrasOpciones,
    '{"enabled": false, "gtmId": "", "metaPixelId": "", "metaAccessToken": ""}'::jsonb as analytics,
    '{"banner": "", "poster": "", "gallery": []}'::jsonb as imagenes,
    '["rock", "concierto"]'::jsonb as tags,
    '{}'::jsonb as configuracion
FROM recintos r
CROSS JOIN salas s
WHERE r.id = s.recinto_id
LIMIT 1

UNION ALL

SELECT 
    'Teatro Clásico' as nombre,
    'Obra de teatro clásica con actores reconocidos' as descripcion,
    r.id as recinto,
    s.id as sala,
    true as activo,
    'VIP' as sector,
    'a-la-venta' as estadoVenta,
    'Próximamente' as descripcionEstado,
    false as estadoPersonalizado,
    true as mostrarDatosComprador,
    false as mostrarDatosBoleto,
    '{"nombre": {"solicitado": true, "obligatorio": true}, "email": {"solicitado": true, "obligatorio": true}}'::jsonb as datosComprador,
    '{}'::jsonb as datosBoleto,
    '{}'::jsonb as otrasOpciones,
    '{"enabled": false, "gtmId": "", "metaPixelId": "", "metaAccessToken": ""}'::jsonb as analytics,
    '{"banner": "", "poster": "", "gallery": []}'::jsonb as imagenes,
    '["teatro", "clásico"]'::jsonb as tags,
    '{}'::jsonb as configuracion
FROM recintos r
CROSS JOIN salas s
WHERE r.id = s.recinto_id
LIMIT 1

UNION ALL

SELECT 
    'Comedia Stand-up' as nombre,
    'Noche de comedia con los mejores comediantes' as descripcion,
    r.id as recinto,
    s.id as sala,
    true as activo,
    'General' as sector,
    'a-la-venta' as estadoVenta,
    'Disponible' as descripcionEstado,
    false as estadoPersonalizado,
    false as mostrarDatosComprador,
    false as mostrarDatosBoleto,
    '{}'::jsonb as datosComprador,
    '{}'::jsonb as datosBoleto,
    '{}'::jsonb as otrasOpciones,
    '{"enabled": false, "gtmId": "", "metaPixelId": "", "metaAccessToken": ""}'::jsonb as analytics,
    '{"banner": "", "poster": "", "gallery": []}'::jsonb as imagenes,
    '["comedia", "stand-up"]'::jsonb as tags,
    '{}'::jsonb as configuracion
FROM recintos r
CROSS JOIN salas s
WHERE r.id = s.recinto_id
LIMIT 1

ON CONFLICT DO NOTHING;

-- Verificar eventos insertados
SELECT 
    'EVENTOS INSERTADOS' as categoria,
    id,
    nombre,
    recinto,
    sala,
    activo,
    created_at
FROM eventos
ORDER BY created_at DESC
LIMIT 5;

-- Mostrar resumen final
SELECT 
    'RESUMEN FINAL' as categoria,
    COUNT(*) as total_eventos,
    COUNT(CASE WHEN activo = true THEN 1 END) as eventos_activos,
    COUNT(CASE WHEN activo = false THEN 1 END) as eventos_inactivos
FROM eventos; 