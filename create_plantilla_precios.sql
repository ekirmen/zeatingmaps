-- 🎫 Crear Plantilla de Precios para ZeatingMaps
-- Este script crea una plantilla de precios con zonas y precios

-- =====================================================
-- VERIFICAR PLANTILLAS EXISTENTES
-- =====================================================

-- Mostrar plantillas existentes del tenant
SELECT 
    'PLANTILLAS EXISTENTES' as tipo,
    id,
    nombre,
    tenant_id,
    created_at
FROM plantillas_precios 
WHERE tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY created_at;

-- =====================================================
-- CREAR PLANTILLA DE PRECIOS
-- =====================================================

-- Crear plantilla de precios principal
INSERT INTO plantillas_precios (
    nombre,
    descripcion,
    tenant_id,
    activa
)
SELECT 
    'Plantilla Premium ZeatingMaps' as nombre,
    'Plantilla con zonas VIP y General' as descripcion,
    '2b86dc35-49ad-43ea-a50d-a14c55a327cc' as tenant_id,
    true as activa
WHERE NOT EXISTS (
    SELECT 1 FROM plantillas_precios 
    WHERE tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
    AND nombre = 'Plantilla Premium ZeatingMaps'
);

-- =====================================================
-- CREAR ZONAS DE PRECIOS
-- =====================================================

-- Crear zona VIP
INSERT INTO zonas_precios (
    plantilla_id,
    nombre,
    precio,
    color,
    descripcion
)
SELECT 
    pp.id as plantilla_id,
    'Zona VIP' as nombre,
    150.00 as precio,
    '#FFD700' as color,
    'Asientos premium con mejor vista' as descripcion
FROM plantillas_precios pp
WHERE pp.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND pp.nombre = 'Plantilla Premium ZeatingMaps'
AND NOT EXISTS (
    SELECT 1 FROM zonas_precios zp 
    WHERE zp.plantilla_id = pp.id 
    AND zp.nombre = 'Zona VIP'
);

-- Crear zona General
INSERT INTO zonas_precios (
    plantilla_id,
    nombre,
    precio,
    color,
    descripcion
)
SELECT 
    pp.id as plantilla_id,
    'Zona General' as nombre,
    75.00 as precio,
    '#4CAF50' as color,
    'Asientos generales' as descripcion
FROM plantillas_precios pp
WHERE pp.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND pp.nombre = 'Plantilla Premium ZeatingMaps'
AND NOT EXISTS (
    SELECT 1 FROM zonas_precios zp 
    WHERE zp.plantilla_id = pp.id 
    AND zp.nombre = 'Zona General'
);

-- Crear zona Económica
INSERT INTO zonas_precios (
    plantilla_id,
    nombre,
    precio,
    color,
    descripcion
)
SELECT 
    pp.id as plantilla_id,
    'Zona Económica' as nombre,
    45.00 as precio,
    '#2196F3' as color,
    'Asientos económicos' as descripcion
FROM plantillas_precios pp
WHERE pp.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND pp.nombre = 'Plantilla Premium ZeatingMaps'
AND NOT EXISTS (
    SELECT 1 FROM zonas_precios zp 
    WHERE zp.plantilla_id = pp.id 
    AND zp.nombre = 'Zona Económica'
);

-- =====================================================
-- ASIGNAR PLANTILLA A EVENTOS
-- =====================================================

-- Asignar plantilla a eventos existentes
UPDATE eventos 
SET plantilla_precios_id = (
    SELECT id FROM plantillas_precios 
    WHERE tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
    AND nombre = 'Plantilla Premium ZeatingMaps'
)
WHERE tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
AND plantilla_precios_id IS NULL;

-- =====================================================
-- VERIFICAR RESULTADOS
-- =====================================================

-- Mostrar plantilla creada
SELECT 
    'PLANTILLA CREADA' as tipo,
    pp.id,
    pp.nombre,
    pp.tenant_id,
    COUNT(zp.id) as total_zonas
FROM plantillas_precios pp
LEFT JOIN zonas_precios zp ON pp.id = zp.plantilla_id
WHERE pp.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
GROUP BY pp.id, pp.nombre, pp.tenant_id;

-- Mostrar zonas creadas
SELECT 
    'ZONAS CREADAS' as tipo,
    zp.id,
    zp.nombre,
    zp.precio,
    zp.color,
    zp.descripcion
FROM zonas_precios zp
JOIN plantillas_precios pp ON zp.plantilla_id = pp.id
WHERE pp.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY zp.precio DESC;

-- Verificar eventos con plantilla
SELECT 
    'EVENTOS CON PLANTILLA' as tipo,
    e.id,
    e.nombre,
    e.plantilla_precios_id,
    pp.nombre as plantilla_nombre
FROM eventos e
LEFT JOIN plantillas_precios pp ON e.plantilla_precios_id = pp.id
WHERE e.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc';

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará una plantilla de precios con 3 zonas
3. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- 1 plantilla de precios creada
- 3 zonas de precios (VIP, General, Económica)
- Los eventos tendrán plantilla asignada
- El mapa debería mostrar las zonas con colores
*/
