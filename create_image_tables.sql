-- Crear tabla para imágenes de eventos
CREATE TABLE IF NOT EXISTS evento_imagenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  orden INTEGER DEFAULT 0,
  tipo TEXT DEFAULT 'principal' CHECK (tipo IN ('principal', 'galeria', 'banner')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para imágenes de recintos
CREATE TABLE IF NOT EXISTS recinto_imagenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recinto_id UUID NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  orden INTEGER DEFAULT 0,
  tipo TEXT DEFAULT 'principal' CHECK (tipo IN ('principal', 'galeria', 'exterior', 'interior')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_evento_imagenes_evento_id ON evento_imagenes(evento_id);
CREATE INDEX IF NOT EXISTS idx_evento_imagenes_tipo ON evento_imagenes(tipo);
CREATE INDEX IF NOT EXISTS idx_evento_imagenes_orden ON evento_imagenes(orden);

CREATE INDEX IF NOT EXISTS idx_recinto_imagenes_recinto_id ON recinto_imagenes(recinto_id);
CREATE INDEX IF NOT EXISTS idx_recinto_imagenes_tipo ON recinto_imagenes(tipo);
CREATE INDEX IF NOT EXISTS idx_recinto_imagenes_orden ON recinto_imagenes(orden);

-- Agregar foreign keys después de verificar que las tablas existen
DO $$
BEGIN
  -- Verificar si la tabla eventos existe y tiene el campo id como UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'eventos' 
    AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'eventos' 
    AND column_name = 'id' 
    AND data_type = 'uuid'
  ) THEN
    -- Agregar foreign key para evento_imagenes
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'evento_imagenes_evento_id_fkey'
    ) THEN
      ALTER TABLE evento_imagenes 
      ADD CONSTRAINT evento_imagenes_evento_id_fkey 
      FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- Verificar si la tabla recintos existe y tiene el campo id como UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'recintos' 
    AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recintos' 
    AND column_name = 'id' 
    AND data_type = 'uuid'
  ) THEN
    -- Agregar foreign key para recinto_imagenes
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'recinto_imagenes_recinto_id_fkey'
    ) THEN
      ALTER TABLE recinto_imagenes 
      ADD CONSTRAINT recinto_imagenes_recinto_id_fkey 
      FOREIGN KEY (recinto_id) REFERENCES recintos(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE evento_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recinto_imagenes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS solo si no existen
DO $$
BEGIN
  -- Políticas para evento_imagenes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'evento_imagenes' 
    AND policyname = 'Users can view event images'
  ) THEN
    CREATE POLICY "Users can view event images" ON evento_imagenes
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'evento_imagenes' 
    AND policyname = 'Users can insert event images'
  ) THEN
    CREATE POLICY "Users can insert event images" ON evento_imagenes
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'evento_imagenes' 
    AND policyname = 'Users can update event images'
  ) THEN
    CREATE POLICY "Users can update event images" ON evento_imagenes
      FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;

  -- Políticas para recinto_imagenes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recinto_imagenes' 
    AND policyname = 'Users can view venue images'
  ) THEN
    CREATE POLICY "Users can view venue images" ON recinto_imagenes
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recinto_imagenes' 
    AND policyname = 'Users can insert venue images'
  ) THEN
    CREATE POLICY "Users can insert venue images" ON recinto_imagenes
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recinto_imagenes' 
    AND policyname = 'Users can update venue images'
  ) THEN
    CREATE POLICY "Users can update venue images" ON recinto_imagenes
      FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
DO $$
BEGIN
  -- Trigger para evento_imagenes
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_evento_imagenes_updated_at'
  ) THEN
    CREATE TRIGGER update_evento_imagenes_updated_at 
      BEFORE UPDATE ON evento_imagenes 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Trigger para recinto_imagenes
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_recinto_imagenes_updated_at'
  ) THEN
    CREATE TRIGGER update_recinto_imagenes_updated_at 
      BEFORE UPDATE ON recinto_imagenes 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Comentarios de las tablas
COMMENT ON TABLE evento_imagenes IS 'Imágenes asociadas a eventos';
COMMENT ON COLUMN evento_imagenes.evento_id IS 'ID del evento relacionado';
COMMENT ON COLUMN evento_imagenes.url IS 'URL de la imagen';
COMMENT ON COLUMN evento_imagenes.alt_text IS 'Texto alternativo para accesibilidad';
COMMENT ON COLUMN evento_imagenes.orden IS 'Orden de visualización de la imagen';
COMMENT ON COLUMN evento_imagenes.tipo IS 'Tipo de imagen: principal, galeria, banner';

COMMENT ON TABLE recinto_imagenes IS 'Imágenes asociadas a recintos';
COMMENT ON COLUMN recinto_imagenes.recinto_id IS 'ID del recinto relacionado';
COMMENT ON COLUMN recinto_imagenes.url IS 'URL de la imagen';
COMMENT ON COLUMN recinto_imagenes.alt_text IS 'Texto alternativo para accesibilidad';
COMMENT ON COLUMN recinto_imagenes.orden IS 'Orden de visualización de la imagen';
COMMENT ON COLUMN recinto_imagenes.tipo IS 'Tipo de imagen: principal, galeria, exterior, interior';

-- Insertar algunas imágenes de ejemplo (opcional)
-- INSERT INTO evento_imagenes (evento_id, url, alt_text, tipo, orden) VALUES 
--   ('evento-uuid-1', 'https://ejemplo.com/evento1.jpg', 'Imagen principal del evento', 'principal', 1);

-- INSERT INTO recinto_imagenes (recinto_id, url, alt_text, tipo, orden) VALUES 
--   ('recinto-uuid-1', 'https://ejemplo.com/recinto1.jpg', 'Vista exterior del recinto', 'exterior', 1);

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TABLAS DE IMÁGENES CREADAS EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tabla evento_imagenes creada/verificada';
  RAISE NOTICE 'Tabla recinto_imagenes creada/verificada';
  RAISE NOTICE 'Políticas RLS configuradas';
  RAISE NOTICE 'Triggers configurados';
  RAISE NOTICE '¡Sistema listo para usar!';
  RAISE NOTICE '========================================';
END $$;
