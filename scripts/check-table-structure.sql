-- Script simple para verificar la estructura exacta de las tablas
-- Ejecutar este script primero para identificar los nombres correctos de las columnas

-- 1. Verificar estructura de la tabla eventos
SELECT 
  'eventos' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'eventos' 
ORDER BY ordinal_position;

-- 2. Verificar estructura de la tabla tenants
SELECT 
  'tenants' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- 3. Verificar estructura de la tabla event_theme_settings (si existe)
SELECT 
  'event_theme_settings' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'event_theme_settings' 
ORDER BY ordinal_position;

-- 4. Verificar si las tablas existen
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN ('eventos', 'tenants', 'event_theme_settings')
ORDER BY table_name;

-- 5. Verificar datos de ejemplo en tenants (sin JOIN)
SELECT 
  'tenants' as tabla,
  *
FROM tenants
LIMIT 3;

-- 6. Verificar datos de ejemplo en eventos (sin JOIN)
SELECT 
  'eventos' as tabla,
  id,
  nombre,
  tenant_id,
  fecha_evento,
  activo,
  oculto,
  created_at
FROM eventos
LIMIT 3;
