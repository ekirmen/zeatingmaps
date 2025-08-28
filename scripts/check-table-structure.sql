-- Script para verificar la estructura de la tabla eventos
-- Ejecutar primero para ver qué columnas existen

-- 1. Verificar la estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'eventos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar si existen las columnas JSON específicas
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'eventos' 
AND table_schema = 'public'
AND column_name IN ('imagenes', 'datosComprador', 'datosBoleto', 'analytics', 'otrasOpciones', 'tags')
ORDER BY column_name;

-- 3. Verificar el primer evento para ver la estructura real
SELECT 
  id,
  nombre,
  -- Solo seleccionar columnas que sabemos que existen
  CASE WHEN "imagenes" IS NOT NULL THEN 'EXISTE' ELSE 'NO EXISTE' END as imagenes_exists,
  CASE WHEN "datosComprador" IS NOT NULL THEN 'EXISTE' ELSE 'NO EXISTE' END as datosComprador_exists,
  CASE WHEN "datosBoleto" IS NOT NULL THEN 'EXISTE' ELSE 'NO EXISTE' END as datosBoleto_exists
FROM eventos 
LIMIT 1;
