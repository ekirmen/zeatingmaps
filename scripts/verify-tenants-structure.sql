-- Script muy simple para verificar la estructura exacta de la tabla tenants
-- Sin JOINs, solo verificar qué columnas existen realmente

-- 1. Verificar si la tabla tenants existe
SELECT 
  'Verificación de tabla' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') 
    THEN '✅ Tabla tenants existe' 
    ELSE '❌ Tabla tenants NO existe' 
  END as status;

-- 2. Verificar la estructura exacta de la tabla tenants
SELECT 
  'Estructura de tenants' as info,
  column_name,
  data_type,
  is_nullable,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- 3. Verificar datos de ejemplo en tenants (sin especificar columnas)
SELECT 
  'Datos de tenants' as info,
  *
FROM tenants
LIMIT 3;

-- 4. Verificar si hay datos en tenants
SELECT 
  'Conteo de tenants' as info,
  COUNT(*) as total_tenants
FROM tenants;

-- 5. Verificar la estructura de eventos también
SELECT 
  'Estructura de eventos' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'eventos' 
ORDER BY ordinal_position;
