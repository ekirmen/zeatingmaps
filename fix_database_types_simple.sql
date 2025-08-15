-- =====================================================
-- SCRIPT SIMPLE PARA CORREGIR TIPOS DE DATOS
-- =====================================================

-- 1. DIAGNÓSTICO: Verificar estructura actual
SELECT 
  'eventos' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'eventos' 
  AND column_name = 'id'
UNION ALL
SELECT 
  'recintos' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'recintos' 
  AND column_name = 'id';

-- 2. SOLUCIÓN SIMPLE: Crear tablas nuevas con estructura correcta
-- Si las tablas existentes tienen tipos incorrectos, las recreamos

-- 2.1 Crear tabla eventos_temp con estructura correcta
CREATE TABLE IF NOT EXISTS eventos_temp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_inicio TIMESTAMP,
  fecha_fin TIMESTAMP,
  estado VARCHAR(50) DEFAULT 'activo',
  imagen_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2.2 Crear tabla recintos_temp con estructura correcta
CREATE TABLE IF NOT EXISTS recintos_temp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  direccion TEXT,
  capacidad INTEGER,
  ciudad VARCHAR(100),
  estado VARCHAR(100),
  pais VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. MIGRAR DATOS EXISTENTES (solo si las tablas existen)
DO $$
BEGIN
  -- Migrar datos de eventos si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'eventos' 
    AND table_schema = 'public'
  ) THEN
    -- Insertar datos existentes en la tabla temporal
    INSERT INTO eventos_temp (nombre, descripcion, fecha_inicio, fecha_fin, estado, imagen_url)
    SELECT 
      COALESCE(nombre, 'Evento'),
      COALESCE(descripcion, ''),
      COALESCE(fecha_inicio, NOW()),
      COALESCE(fecha_fin, NOW() + INTERVAL '1 day'),
      COALESCE(estado, 'activo'),
      COALESCE(imagen_url, '')
    FROM eventos;
    
    RAISE NOTICE 'Datos de eventos migrados a tabla temporal';
  END IF;

  -- Migrar datos de recintos si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'recintos' 
    AND table_schema = 'public'
  ) THEN
    -- Insertar datos existentes en la tabla temporal
    INSERT INTO recintos_temp (nombre, direccion, capacidad, ciudad, estado, pais)
    SELECT 
      COALESCE(nombre, 'Recinto'),
      COALESCE(direccion, ''),
      COALESCE(capacidad, 0),
      COALESCE(ciudad, ''),
      COALESCE(estado, ''),
      COALESCE(pais, '')
    FROM recintos;
    
    RAISE NOTICE 'Datos de recintos migrados a tabla temporal';
  END IF;
END $$;

-- 4. REEMPLAZAR TABLAS EXISTENTES
DO $$
BEGIN
  -- Reemplazar tabla eventos
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'eventos' 
    AND table_schema = 'public'
  ) THEN
    DROP TABLE eventos;
    RAISE NOTICE 'Tabla eventos antigua eliminada';
  END IF;
  
  -- Reemplazar tabla recintos
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'recintos' 
    AND table_schema = 'public'
  ) THEN
    DROP TABLE recintos;
    RAISE NOTICE 'Tabla recintos antigua eliminada';
  END IF;
END $$;

-- 5. RENOMBRAR TABLAS TEMPORALES
ALTER TABLE eventos_temp RENAME TO eventos;
ALTER TABLE recintos_temp RENAME TO recintos;

-- 6. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_eventos_nombre ON eventos(nombre);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON eventos(fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_recintos_nombre ON recintos(nombre);
CREATE INDEX IF NOT EXISTS idx_recintos_ciudad ON recintos(ciudad);
CREATE INDEX IF NOT EXISTS idx_recintos_estado ON recintos(estado);

-- 7. VERIFICACIÓN FINAL
SELECT 
  'eventos' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'eventos' 
  AND column_name = 'id'
UNION ALL
SELECT 
  'recintos' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'recintos' 
  AND column_name = 'id';

-- 8. MENSAJE DE ÉXITO
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SCRIPT DE CORRECCIÓN COMPLETADO EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Las tablas eventos y recintos ahora tienen campos id de tipo UUID';
  RAISE NOTICE 'Puedes proceder a ejecutar create_image_tables.sql';
  RAISE NOTICE '========================================';
END $$;
