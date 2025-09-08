-- =====================================================
-- TABLAS PARA EL PERFIL DE USUARIO
-- =====================================================

-- Tabla de reservaciones (reservations) - Solo para compatibilidad con el frontend
-- Esta tabla se mantiene vacía, los datos reales están en payment_transactions
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  funcion_id INTEGER REFERENCES funciones(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired', 'active')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  locator VARCHAR(255), -- Compatible con payment_transactions
  seats JSONB, -- Array de asientos seleccionados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Comentario: Esta tabla se mantiene vacía. Los datos reales están en payment_transactions
COMMENT ON TABLE reservations IS 'Tabla vacía para compatibilidad con frontend. Datos reales en payment_transactions';

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

-- Tabla de ventas (sales) - Solo para compatibilidad con el frontend
-- Esta tabla se mantiene vacía, los datos reales están en payment_transactions
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  funcion_id INTEGER REFERENCES funciones(id),
  payment_transaction_id UUID REFERENCES payment_transactions(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  locator VARCHAR(255), -- Compatible con payment_transactions
  payment_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentario: Esta tabla se mantiene vacía. Los datos reales están en payment_transactions
COMMENT ON TABLE sales IS 'Tabla vacía para compatibilidad con frontend. Datos reales en payment_transactions';

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para reservations
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_evento_id ON reservations(evento_id);
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_id ON reservations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_funcion_id ON reservations(funcion_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_locator ON reservations(locator);
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
CREATE INDEX IF NOT EXISTS idx_sales_funcion_id ON sales(funcion_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_transaction_id ON sales(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_locator ON sales(locator);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Políticas para reservations
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
CREATE POLICY "Users can view their own reservations" ON reservations
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own reservations" ON reservations;
CREATE POLICY "Users can insert their own reservations" ON reservations
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;
CREATE POLICY "Users can update their own reservations" ON reservations
  FOR UPDATE USING (user_id = auth.uid());

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

DROP POLICY IF EXISTS "Users can insert their own sales" ON sales;
CREATE POLICY "Users can insert their own sales" ON sales
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener estadísticas del usuario
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_reservations', COUNT(r.id),
    'active_reservations', COUNT(r.id) FILTER (WHERE r.status = 'confirmed'),
    'total_spent', COALESCE(SUM(s.total_amount), 0),
    'total_payments', (
      SELECT COUNT(*) 
      FROM payment_transactions 
      WHERE user_id = user_uuid 
      AND status = 'completed'
    ),
    'favorite_events', COUNT(f.id),
    'recent_activity', (
      SELECT COUNT(*) 
      FROM user_activity_log 
      WHERE user_id = user_uuid 
      AND created_at > NOW() - INTERVAL '30 days'
    )
  ) INTO result
  FROM reservations r
  LEFT JOIN sales s ON s.reservation_id = r.id
  LEFT JOIN user_favorites f ON f.user_id = user_uuid
  WHERE r.user_id = user_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar actividad del usuario
CREATE OR REPLACE FUNCTION log_user_activity(
  user_uuid UUID,
  action_name VARCHAR(100),
  details JSONB DEFAULT NULL,
  ip_addr INET DEFAULT NULL,
  user_agent_text TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO user_activity_log (
    user_id,
    action,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    user_uuid,
    action_name,
    details,
    ip_addr,
    user_agent_text,
    NOW()
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE reservations IS 'Reservaciones de eventos por usuario';
COMMENT ON TABLE user_activity_log IS 'Log de actividad del usuario';
COMMENT ON TABLE user_favorites IS 'Eventos favoritos del usuario';
COMMENT ON TABLE sales IS 'Ventas realizadas por usuario';
