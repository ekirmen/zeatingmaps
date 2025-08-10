-- Script para habilitar Realtime en la tabla mapas
-- Este script usa el método correcto de Supabase para habilitar Realtime

-- 1. Verificar el estado actual de Realtime
SELECT 
  'Estado actual de Realtime' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'mapas'
    ) THEN '✅ Realtime habilitado para mapas'
    ELSE '❌ Realtime NO habilitado para mapas'
  END as status;

-- 2. Habilitar Realtime para la tabla mapas usando el método correcto
-- Esto añade la tabla a la publicación de Realtime
INSERT INTO pg_publication_tables (pubname, schemaname, tablename)
VALUES ('supabase_realtime', 'public', 'mapas')
ON CONFLICT (pubname, schemaname, tablename) DO NOTHING;

-- 3. Verificar que la columna updated_at existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mapas'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE mapas ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Columna updated_at añadida a la tabla mapas';
  ELSE
    RAISE NOTICE 'Columna updated_at ya existe en la tabla mapas';
  END IF;
END $$;

-- 4. Crear o actualizar el trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar el trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_mapas_updated_at'
  ) THEN
    CREATE TRIGGER update_mapas_updated_at
      BEFORE UPDATE ON mapas
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Trigger update_mapas_updated_at creado';
  ELSE
    RAISE NOTICE 'Trigger update_mapas_updated_at ya existe';
  END IF;
END $$;

-- 5. Verificar el estado final
SELECT 
  'Estado final de configuración' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'mapas'
    ) THEN '✅ Realtime habilitado'
    ELSE '❌ Realtime NO habilitado'
  END as realtime_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'mapas'
      AND column_name = 'updated_at'
    ) THEN '✅ updated_at presente'
    ELSE '❌ updated_at NO presente'
  END as updated_at_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'update_mapas_updated_at'
    ) THEN '✅ Trigger presente'
    ELSE '❌ Trigger NO presente'
  END as trigger_status;
