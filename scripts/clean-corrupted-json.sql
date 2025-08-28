-- Script para limpiar campos JSON corruptos en la base de datos
-- Ejecutar este script para corregir datos existentes corruptos

-- 1. Limpiar campo 'imagenes' corrupto
UPDATE eventos 
SET imagenes = '{}' 
WHERE imagenes::text ~ '"[0-9]+"';

-- 2. Limpiar campo 'datosComprador' corrupto
UPDATE eventos 
SET datosComprador = '{}' 
WHERE datosComprador::text ~ '"[0-9]+"';

-- 3. Limpiar campo 'datosBoleto' corrupto
UPDATE eventos 
SET datosBoleto = '{}' 
WHERE datosBoleto::text ~ '"[0-9]+"';

-- 4. Limpiar campo 'analytics' corrupto
UPDATE eventos 
SET analytics = '{"enabled": false, "gtmId": ""}' 
WHERE analytics::text ~ '"[0-9]+"';

-- 5. Limpiar campo 'otrasOpciones' corrupto
UPDATE eventos 
SET otrasOpciones = '{}' 
WHERE otrasOpciones::text ~ '"[0-9]+"';

-- 6. Limpiar campo 'tags' corrupto
UPDATE eventos 
SET tags = '[]' 
WHERE tags::text ~ '"[0-9]+"';

-- 7. Verificar eventos con campos corruptos (debe retornar 0 filas después de la limpieza)
SELECT 
  id,
  nombre,
  CASE WHEN imagenes::text ~ '"[0-9]+"' THEN 'CORRUPTO' ELSE 'OK' END as imagenes_status,
  CASE WHEN datosComprador::text ~ '"[0-9]+"' THEN 'CORRUPTO' ELSE 'OK' END as datosComprador_status,
  CASE WHEN datosBoleto::text ~ '"[0-9]+"' THEN 'CORRUPTO' ELSE 'OK' END as datosBoleto_status,
  CASE WHEN analytics::text ~ '"[0-9]+"' THEN 'CORRUPTO' ELSE 'OK' END as analytics_status,
  CASE WHEN otrasOpciones::text ~ '"[0-9]+"' THEN 'CORRUPTO' ELSE 'OK' END as otrasOpciones_status,
  CASE WHEN tags::text ~ '"[0-9]+"' THEN 'CORRUPTO' ELSE 'OK' END as tags_status
FROM eventos 
WHERE 
  imagenes::text ~ '"[0-9]+"' OR
  datosComprador::text ~ '"[0-9]+"' OR
  datosBoleto::text ~ '"[0-9]+"' OR
  analytics::text ~ '"[0-9]+"' OR
  otrasOpciones::text ~ '"[0-9]+"' OR
  tags::text ~ '"[0-9]+"';

-- 8. Contar eventos limpiados
SELECT 
  COUNT(*) as total_eventos,
  COUNT(CASE WHEN imagenes::text ~ '"[0-9]+"' THEN 1 END) as imagenes_corruptos,
  COUNT(CASE WHEN datosComprador::text ~ '"[0-9]+"' THEN 1 END) as datosComprador_corruptos,
  COUNT(CASE WHEN datosBoleto::text ~ '"[0-9]+"' THEN 1 END) as datosBoleto_corruptos,
  COUNT(CASE WHEN analytics::text ~ '"[0-9]+"' THEN 1 END) as analytics_corruptos,
  COUNT(CASE WHEN otrasOpciones::text ~ '"[0-9]+"' THEN 1 END) as otrasOpciones_corruptos,
  COUNT(CASE WHEN tags::text ~ '"[0-9]+"' THEN 1 END) as tags_corruptos
FROM eventos;
