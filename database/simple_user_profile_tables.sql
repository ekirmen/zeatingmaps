-- =====================================================
-- TABLAS SIMPLES PARA PERFIL DE USUARIO
-- =====================================================
-- Estas tablas se mantienen vacías, los datos reales están en payment_transactions

-- Tabla de reservaciones (vacía, solo para compatibilidad)
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  funcion_id INTEGER REFERENCES funciones(id),
  status VARCHAR(20) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  locator VARCHAR(255),
  seats JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de actividad del usuario (user_activity_log)
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de favoritos del usuario (user_favorites)
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Tabla de ventas (vacía, solo para compatibilidad)
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  funcion_id INTEGER REFERENCES funciones(id),
  payment_transaction_id UUID REFERENCES payment_transactions(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  locator VARCHAR(255),
  payment_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES BÁSICOS
-- =====================================================

-- Índices para reservations
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_evento_id ON reservations(evento_id);
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_id ON reservations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);

-- Índices para user_activity_log
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_tenant_id ON user_activity_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);

-- Índices para user_favorites
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_event_id ON user_favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_tenant_id ON user_favorites(tenant_id);

-- Índices para sales
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_reservation_id ON sales(reservation_id);
CREATE INDEX IF NOT EXISTS idx_sales_evento_id ON sales(evento_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- =====================================================
-- POLÍTICAS RLS BÁSICAS
-- =====================================================

-- Habilitar RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Políticas para reservations
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
CREATE POLICY "Users can view their own reservations" ON reservations
  FOR SELECT USING (user_id = auth.uid());

-- Políticas para user_activity_log
DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity_log;
CREATE POLICY "Users can view their own activity" ON user_activity_log
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own activity" ON user_activity_log;
CREATE POLICY "Users can insert their own activity" ON user_activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para user_favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own favorites" ON user_favorites;
CREATE POLICY "Users can manage their own favorites" ON user_favorites
  FOR ALL USING (user_id = auth.uid());

-- Políticas para sales
DROP POLICY IF EXISTS "Users can view their own sales" ON sales;
CREATE POLICY "Users can view their own sales" ON sales
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- FUNCIÓN PARA OBTENER ESTADÍSTICAS DESDE PAYMENT_TRANSACTIONS
-- =====================================================

-- Función principal para obtener estadísticas del usuario
CREATE OR REPLACE FUNCTION get_user_stats_from_payments(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_payments', COUNT(pt.id),
    'completed_payments', COUNT(pt.id) FILTER (WHERE pt.status = 'completed'),
    'pending_payments', COUNT(pt.id) FILTER (WHERE pt.status = 'pending'),
    'failed_payments', COUNT(pt.id) FILTER (WHERE pt.status = 'failed'),
    'total_spent', COALESCE(SUM(pt.amount), 0),
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

COMMENT ON TABLE reservations IS 'Tabla vacía para compatibilidad con frontend. Datos reales en payment_transactions';
COMMENT ON TABLE sales IS 'Tabla vacía para compatibilidad con frontend. Datos reales en payment_transactions';
COMMENT ON TABLE user_activity_log IS 'Log de actividad del usuario';
COMMENT ON TABLE user_favorites IS 'Eventos favoritos del usuario';
COMMENT ON FUNCTION get_user_stats_from_payments(UUID) IS 'Obtiene estadísticas del usuario desde payment_transactions';
