-- Habilitar Realtime para la tabla mapas
-- Este script configura las columnas necesarias para Realtime

-- Verificar si Realtime está habilitado para la tabla mapas
SELECT
  schemaname,
  tablename,
  rowsecurity,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'mapas'
    ) THEN 'Realtime habilitado'
    ELSE 'Realtime NO habilitado'
  END as realtime_status
FROM pg_tables
WHERE tablename = 'mapas' AND schemaname = 'public';

-- Verificar que la tabla mapas tenga la columna updated_at para tracking de cambios
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mapas'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE mapas ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Crear o actualizar el trigger para updated_at
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
  END IF;
END $$;

-- Verificar el estado final
SELECT
  'Estado final de Realtime para mapas' as status_check,
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
    ) THEN '✅ Trigger updated_at presente'
    ELSE '❌ Trigger updated_at NO presente'
  END as trigger_status;
