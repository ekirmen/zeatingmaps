-- Script alternativo para corregir la consulta problemática usando cast explícito
-- Este script evita cambiar la estructura de la tabla y solo corrige la consulta

-- 1. Verificar el estado actual
SELECT 'ESTADO ACTUAL - VERIFICANDO TIPOS DE DATOS' as mensaje;

-- Verificar tipos de datos actuales
SELECT 
    'zonas.sala_id' as columna,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'zonas' AND column_name = 'sala_id';

SELECT 
    'salas.id' as columna,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'salas' AND column_name = 'id';

-- 2. CONSULTA CORREGIDA CON CAST EXPLÍCITO
-- Esta es la consulta original corregida para evitar el error de tipo
SELECT 
  z.id,
  z.nombre,
  z.sala_id,
  s.nombre as nombre_sala,
  r.nombre as nombre_recinto,
  r.tenant_id as tenant_del_recinto
FROM zonas z
LEFT JOIN salas s ON z.sala_id::text = s.id::text
LEFT JOIN recintos r ON s.recinto_id::text = r.id::text
WHERE z.tenant_id IS NULL
ORDER BY z.id;

-- 3. ALTERNATIVA: Usar CAST a UUID si es posible
-- Esta versión intenta convertir a UUID antes de hacer el JOIN
SELECT 
  z.id,
  z.nombre,
  z.sala_id,
  s.nombre as nombre_sala,
  r.nombre as nombre_recinto,
  r.tenant_id as tenant_del_recinto
FROM zonas z
LEFT JOIN salas s ON z.sala_id::uuid = s.id::uuid
LEFT JOIN recintos r ON s.recinto_id::uuid = r.id::uuid
WHERE z.tenant_id IS NULL
ORDER BY z.id;

-- 4. ALTERNATIVA: Usar CAST a TEXT para ambos lados
-- Esta versión convierte ambos lados a texto para la comparación
SELECT 
  z.id,
  z.nombre,
  z.sala_id,
  s.nombre as nombre_sala,
  r.nombre as nombre_recinto,
  r.tenant_id as tenant_del_recinto
FROM zonas z
LEFT JOIN salas s ON CAST(z.sala_id AS TEXT) = CAST(s.id AS TEXT)
LEFT JOIN recintos r ON CAST(s.recinto_id AS TEXT) = CAST(r.id AS TEXT)
WHERE z.tenant_id IS NULL
ORDER BY z.id;

-- 5. VERIFICAR SI HAY DATOS PROBLEMÁTICOS
-- Buscar zonas con sala_id que no sean UUID válidos
SELECT 
    'zonas_con_sala_id_problematico' as problema,
    COUNT(*) as total
FROM zonas 
WHERE sala_id IS NOT NULL 
AND sala_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Mostrar ejemplos de datos problemáticos
SELECT 
    'ejemplos_zonas_problematicas' as tipo,
    id,
    sala_id,
    pg_typeof(sala_id) as tipo_dato
FROM zonas 
WHERE sala_id IS NOT NULL 
AND sala_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
LIMIT 5;

-- 6. RECOMENDACIÓN FINAL
SELECT 'RECOMENDACIÓN: Usar la consulta con CAST a TEXT (opción 4)' as mensaje;
SELECT 'Esta opción es la más segura y no requiere cambios en la estructura de la tabla' as explicacion;
