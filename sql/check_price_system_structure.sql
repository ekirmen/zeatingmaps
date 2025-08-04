-- Verificar estructura del sistema de precios
-- Este script verifica las tablas relacionadas con precios, entradas y zonas

-- 1. Verificar tabla entradas
SELECT 
  'entradas' as tabla,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'entradas' 
ORDER BY ordinal_position;

-- 2. Verificar tabla zonas
SELECT 
  'zonas' as tabla,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'zonas' 
ORDER BY ordinal_position;

-- 3. Verificar tabla plantillas_precios
SELECT 
  'plantillas_precios' as tabla,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'plantillas_precios' 
ORDER BY ordinal_position;

-- 4. Verificar tabla plantillas_precios_detalles
SELECT 
  'plantillas_precios_detalles' as tabla,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'plantillas_precios_detalles' 
ORDER BY ordinal_position;

-- 5. Contar registros en cada tabla
SELECT 'entradas' as tabla, COUNT(*) as total FROM entradas WHERE activo = true;
SELECT 'zonas' as tabla, COUNT(*) as total FROM zonas WHERE activo = true;
SELECT 'plantillas_precios' as tabla, COUNT(*) as total FROM plantillas_precios WHERE activo = true;
SELECT 'plantillas_precios_detalles' as tabla, COUNT(*) as total FROM plantillas_precios_detalles;

-- 6. Mostrar ejemplos de datos
SELECT 'entradas' as tabla, id, nombre, categoria, activo FROM entradas WHERE activo = true LIMIT 5;
SELECT 'zonas' as tabla, id, nombre, aforo, activo FROM zonas WHERE activo = true LIMIT 5;
SELECT 'plantillas_precios' as tabla, id, nombre, tipo, color, activo FROM plantillas_precios WHERE activo = true LIMIT 5;

-- 7. Mostrar detalles de precios
SELECT 
  pp.nombre as plantilla,
  e.nombre as entrada,
  z.nombre as zona,
  ppd.precio,
  ppd.comision_usuario,
  ppd.precio_original
FROM plantillas_precios_detalles ppd
JOIN plantillas_precios pp ON ppd.plantilla_id = pp.id
JOIN entradas e ON ppd.entrada_id = e.id
JOIN zonas z ON ppd.zona_id = z.id
WHERE pp.activo = true
ORDER BY pp.nombre, e.nombre, z.nombre
LIMIT 10; 