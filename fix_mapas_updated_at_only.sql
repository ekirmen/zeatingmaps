-- Script para configurar updated_at en la tabla mapas
-- NOTA: Realtime debe habilitarse manualmente desde el dashboard de Supabase

-- 1. Verificar que la columna updated_at existe
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

-- 2. Crear o actualizar el trigger para updated_at
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

-- 3. Verificar el estado final
SELECT
  'Estado de configuración' as check_type,
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

-- 4. Instrucciones para habilitar Realtime
SELECT 
  'INSTRUCCIONES PARA REALTIME' as instruction_type,
  '1. Ve al dashboard de Supabase' as step_1,
  '2. Navega a Database → Replication' as step_2,
  '3. Busca la tabla "mapas" en la lista' as step_3,
  '4. Activa el switch de Realtime a ON' as step_4;
