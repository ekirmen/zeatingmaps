-- =====================================================
-- TABLAS PARA SISTEMA SAAS COMPLETO - VERSIÓN LIMPIA
-- =====================================================

-- Tabla de suscripciones de facturación
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  customer_email VARCHAR(255) NOT NULL,
  next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  payment_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de transacciones de pago
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES billing_subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(50) DEFAULT 'subscription',
  status VARCHAR(20) DEFAULT 'pending',
  transaction_id VARCHAR(255),
  gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tickets de soporte
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de mensajes de soporte
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type VARCHAR(20) DEFAULT 'customer',
  content TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de métricas del sistema
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metric_type VARCHAR(50) DEFAULT 'counter',
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para billing_subscriptions
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_tenant_id ON billing_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status ON billing_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_next_billing ON billing_subscriptions(next_billing_date);

-- Índices para payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Índices para support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);

-- Índices para support_messages
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_id ON support_messages(sender_id);

-- Índices para system_metrics
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_tenant_id ON system_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para billing_subscriptions
DROP POLICY IF EXISTS "Users can view their tenant's subscriptions" ON billing_subscriptions;
CREATE POLICY "Users can view their tenant's subscriptions" ON billing_subscriptions
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all subscriptions" ON billing_subscriptions;
CREATE POLICY "Super admins can manage all subscriptions" ON billing_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND rol = 'super_admin'
    )
  );

-- Políticas para payment_transactions
DROP POLICY IF EXISTS "Users can view their tenant's transactions" ON payment_transactions;
CREATE POLICY "Users can view their tenant's transactions" ON payment_transactions
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all transactions" ON payment_transactions;
CREATE POLICY "Super admins can manage all transactions" ON payment_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND rol = 'super_admin'
    )
  );

-- Políticas para notifications
DROP POLICY IF EXISTS "Users can view their tenant's notifications" ON notifications;
CREATE POLICY "Users can view their tenant's notifications" ON notifications
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    )
  );

DROP POLICY IF EXISTS "Users can update their tenant's notifications" ON notifications;
CREATE POLICY "Users can update their tenant's notifications" ON notifications
  FOR UPDATE USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all notifications" ON notifications;
CREATE POLICY "Super admins can manage all notifications" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND rol = 'super_admin'
    )
  );

-- Políticas para audit_logs
DROP POLICY IF EXISTS "Users can view their tenant's audit logs" ON audit_logs;
CREATE POLICY "Users can view their tenant's audit logs" ON audit_logs
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all audit logs" ON audit_logs;
CREATE POLICY "Super admins can manage all audit logs" ON audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND rol = 'super_admin'
    )
  );

-- Políticas para support_tickets
DROP POLICY IF EXISTS "Users can view their tenant's tickets" ON support_tickets;
CREATE POLICY "Users can view their tenant's tickets" ON support_tickets
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    )
  );

DROP POLICY IF EXISTS "Users can create tickets for their tenant" ON support_tickets;
CREATE POLICY "Users can create tickets for their tenant" ON support_tickets
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all tickets" ON support_tickets;
CREATE POLICY "Super admins can manage all tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND rol = 'super_admin'
    )
  );

-- Políticas para support_messages
DROP POLICY IF EXISTS "Users can view messages for their tenant's tickets" ON support_messages;
CREATE POLICY "Users can view messages for their tenant's tickets" ON support_messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
      )
    )
  );

DROP POLICY IF EXISTS "Users can create messages for their tenant's tickets" ON support_messages;
CREATE POLICY "Users can create messages for their tenant's tickets" ON support_messages
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
      )
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all messages" ON support_messages;
CREATE POLICY "Super admins can manage all messages" ON support_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND rol = 'super_admin'
    )
  );

-- Políticas para system_metrics
DROP POLICY IF EXISTS "Super admins can manage all metrics" ON system_metrics;
CREATE POLICY "Super admins can manage all metrics" ON system_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND rol = 'super_admin'
    )
  );

-- Políticas para system_settings
DROP POLICY IF EXISTS "Super admins can manage all settings" ON system_settings;
CREATE POLICY "Super admins can manage all settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND rol = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Public settings are readable by all" ON system_settings;
CREATE POLICY "Public settings are readable by all" ON system_settings
  FOR SELECT USING (is_public = true);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Configuraciones del sistema
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('stripe_secret_key', '', 'Clave secreta de Stripe para procesamiento de pagos', 'payment', false),
('stripe_publishable_key', '', 'Clave pública de Stripe', 'payment', true),
('system_name', 'Omega Boletos SaaS', 'Nombre del sistema', 'general', true),
('system_version', '1.0.0', 'Versión del sistema', 'general', true),
('maintenance_mode', 'false', 'Modo de mantenimiento del sistema', 'general', true),
('max_tenants', '1000', 'Número máximo de tenants permitidos', 'limits', false),
('default_plan', 'basic', 'Plan por defecto para nuevos tenants', 'billing', false)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- FUNCIONES Y TRIGGERS
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
DROP TRIGGER IF EXISTS update_billing_subscriptions_updated_at ON billing_subscriptions;
CREATE TRIGGER update_billing_subscriptions_updated_at BEFORE UPDATE ON billing_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar número de ticket automáticamente
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := 'TK-' || LPAD(nextval('ticket_number_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Secuencia para números de ticket
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- Trigger para generar número de ticket
DROP TRIGGER IF EXISTS generate_ticket_number_trigger ON support_tickets;
CREATE TRIGGER generate_ticket_number_trigger 
    BEFORE INSERT ON support_tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION generate_ticket_number();

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE billing_subscriptions IS 'Suscripciones de facturación de los tenants';
COMMENT ON TABLE payment_transactions IS 'Transacciones de pago procesadas';
COMMENT ON TABLE notifications IS 'Notificaciones del sistema para tenants';
COMMENT ON TABLE audit_logs IS 'Logs de auditoría de todas las acciones del sistema';
COMMENT ON TABLE support_tickets IS 'Tickets de soporte técnico';
COMMENT ON TABLE support_messages IS 'Mensajes de los tickets de soporte';
COMMENT ON TABLE system_metrics IS 'Métricas del sistema para analytics';
COMMENT ON TABLE system_settings IS 'Configuraciones globales del sistema';
