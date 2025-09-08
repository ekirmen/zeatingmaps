-- =====================================================
-- ARREGLAR TABLA RESERVAS EXISTENTE
-- =====================================================

-- Agregar columna user_id a la tabla reservas si no existe
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Crear índice para user_id en reservas
CREATE INDEX IF NOT EXISTS idx_reservas_user_id ON reservas(user_id);

-- Agregar política RLS para reservas si no existe
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios vean sus propias reservas
DROP POLICY IF EXISTS "Users can view their own reservas" ON reservas;
CREATE POLICY "Users can view their own reservas" ON reservas
  FOR SELECT USING (user_id = auth.uid());

-- Política para que los usuarios puedan insertar sus propias reservas
DROP POLICY IF EXISTS "Users can insert their own reservas" ON reservas;
CREATE POLICY "Users can insert their own reservas" ON reservas
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Política para que los usuarios puedan actualizar sus propias reservas
DROP POLICY IF EXISTS "Users can update their own reservas" ON reservas;
CREATE POLICY "Users can update their own reservas" ON reservas
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- FUNCIÓN PARA MIGRAR DATOS DE RESERVAS A RESERVATIONS
-- =====================================================

-- Función para migrar reservas existentes a reservations
CREATE OR REPLACE FUNCTION migrate_reservas_to_reservations()
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER := 0;
  reserva_record RECORD;
BEGIN
  -- Migrar solo reservas que tengan user_id
  FOR reserva_record IN 
    SELECT * FROM reservas 
    WHERE user_id IS NOT NULL
  LOOP
    INSERT INTO reservations (
      id,
      user_id,
      evento_id,
      tenant_id,
      funcion_id,
      status,
      total_amount,
      payment_status,
      payment_method,
      locator,
      seats,
      created_at,
      updated_at
    ) VALUES (
      reserva_record.id,
      reserva_record.user_id,
      reserva_record.evento_id,
      reserva_record.tenant_id,
      reserva_record.funcion_id,
      COALESCE(reserva_record.status, 'pending'),
      COALESCE(reserva_record.total_amount, 0),
      COALESCE(reserva_record.payment_status, 'pending'),
      reserva_record.payment_method,
      reserva_record.locator,
      reserva_record.seats,
      COALESCE(reserva_record.created_at, NOW()),
      COALESCE(reserva_record.updated_at, NOW())
    ) ON CONFLICT (id) DO NOTHING;
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA OBTENER ESTADÍSTICAS COMPATIBLES
-- =====================================================

-- Función para obtener estadísticas usando payment_transactions
CREATE OR REPLACE FUNCTION get_user_stats_from_payments(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_payments', COUNT(pt.id),
    'completed_payments', COUNT(pt.id) FILTER (WHERE pt.status = 'completed'),
    'total_spent', COALESCE(SUM(pt.amount), 0),
    'pending_payments', COUNT(pt.id) FILTER (WHERE pt.status = 'pending'),
    'failed_payments', COUNT(pt.id) FILTER (WHERE pt.status = 'failed'),
    'recent_payments', (
      SELECT COUNT(*) 
      FROM payment_transactions 
      WHERE user_id = user_uuid 
      AND created_at > NOW() - INTERVAL '30 days'
    ),
    'favorite_events', (
      SELECT COUNT(*) 
      FROM user_favorites 
      WHERE user_id = user_uuid
    ),
    'recent_activity', (
      SELECT COUNT(*) 
      FROM user_activity_log 
      WHERE user_id = user_uuid 
      AND created_at > NOW() - INTERVAL '30 days'
    )
  ) INTO result
  FROM payment_transactions pt
  WHERE pt.user_id = user_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON COLUMN reservas.user_id IS 'ID del usuario que hizo la reserva';
COMMENT ON FUNCTION migrate_reservas_to_reservations() IS 'Migra datos de reservas a reservations';
COMMENT ON FUNCTION get_user_stats_from_payments(UUID) IS 'Obtiene estadísticas del usuario desde payment_transactions';
