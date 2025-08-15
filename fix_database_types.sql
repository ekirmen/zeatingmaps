-- =====================================================
-- SCRIPT PARA DIAGNOSTICAR Y CORREGIR TIPOS DE DATOS
-- =====================================================

-- 1. DIAGNÓSTICO: Verificar tipos de datos actuales
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

-- 2. DIAGNÓSTICO: Verificar si las tablas existen
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN ('eventos', 'recintos')
  AND table_schema = 'public';

-- 3. CORRECCIÓN: Si la tabla eventos no existe, crearla
CREATE TABLE IF NOT EXISTS eventos (
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

-- 4. CORRECCIÓN: Si la tabla recintos no existe, crearla
CREATE TABLE IF NOT EXISTS recintos (
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

-- 5. CORRECCIÓN: Si las tablas existen pero tienen tipos incorrectos, corregirlas
DO $$
BEGIN
  -- Verificar y corregir tabla eventos
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'eventos' 
    AND table_schema = 'public'
  ) THEN
    -- Si el campo id no es UUID, cambiarlo
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'eventos' 
      AND column_name = 'id' 
      AND data_type != 'uuid'
    ) THEN
      -- Crear tabla temporal con estructura correcta
      CREATE TABLE eventos_temp (
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
      
      -- Copiar datos existentes (si los hay)
      INSERT INTO eventos_temp (nombre, descripcion, fecha_inicio, fecha_fin, estado, imagen_url, created_at, updated_at)
      SELECT nombre, descripcion, fecha_inicio, fecha_fin, estado, imagen_url, created_at, updated_at
      FROM eventos;
      
      -- Eliminar tabla antigua y renombrar la nueva
      DROP TABLE eventos;
      ALTER TABLE eventos_temp RENAME TO eventos;
      
      RAISE NOTICE 'Tabla eventos corregida: campo id cambiado a UUID';
    END IF;
  END IF;

  -- Verificar y corregir tabla recintos
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'recintos' 
    AND table_schema = 'public'
  ) THEN
    -- Si el campo id no es UUID, cambiarlo
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'recintos' 
      AND column_name = 'id' 
      AND data_type != 'uuid'
    ) THEN
      -- Crear tabla temporal con estructura correcta
      CREATE TABLE recintos_temp (
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
      
      -- Copiar datos existentes (si los hay)
      INSERT INTO recintos_temp (nombre, direccion, capacidad, ciudad, estado, pais, created_at, updated_at)
      SELECT nombre, direccion, capacidad, ciudad, estado, pais, created_at, updated_at
      FROM recintos;
      
      -- Eliminar tabla antigua y renombrar la nueva
      DROP TABLE recintos;
      ALTER TABLE recintos_temp RENAME TO recintos;
      
      RAISE NOTICE 'Tabla recintos corregida: campo id cambiado a UUID';
    END IF;
  END IF;
END $$;

-- 6. VERIFICACIÓN FINAL: Confirmar que los tipos son correctos
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

-- 7. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_eventos_nombre ON eventos(nombre);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON eventos(fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_recintos_nombre ON recintos(nombre);
CREATE INDEX IF NOT EXISTS idx_recintos_ciudad ON recintos(ciudad);
CREATE INDEX IF NOT EXISTS idx_recintos_estado ON recintos(estado);

-- 8. MENSAJE DE ÉXITO
DO $$
BEGIN
  RAISE NOTICE 'Script de corrección completado exitosamente';
  RAISE NOTICE 'Las tablas eventos y recintos ahora tienen campos id de tipo UUID';
  RAISE NOTICE 'Puedes proceder a ejecutar create_image_tables.sql';
END $$;
