-- =====================================================
-- PARTES FALTANTES DEL SISTEMA SAAS
-- =====================================================

-- Índices para audit_logs (CORREGIDO - usando created_at en lugar de timestamp)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Políticas para billing_subscriptions
DROP POLICY IF EXISTS "Users can view their tenant's subscriptions" ON billing_subscriptions;
CREATE POLICY "Users can view their tenant's subscriptions" ON billing_subscriptions
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "Super admins can manage all subscriptions" ON billing_subscriptions;
CREATE POLICY "Super admins can manage all subscriptions" ON billing_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Políticas para payment_transactions
DROP POLICY IF EXISTS "Users can view their tenant's transactions" ON payment_transactions;
CREATE POLICY "Users can view their tenant's transactions" ON payment_transactions
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "Super admins can manage all transactions" ON payment_transactions;
CREATE POLICY "Super admins can manage all transactions" ON payment_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Políticas para notifications
DROP POLICY IF EXISTS "Users can view their tenant's notifications" ON notifications;
CREATE POLICY "Users can view their tenant's notifications" ON notifications
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "Users can update their tenant's notifications" ON notifications;
CREATE POLICY "Users can update their tenant's notifications" ON notifications
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "Super admins can manage all notifications" ON notifications;
CREATE POLICY "Super admins can manage all notifications" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Políticas para audit_logs
DROP POLICY IF EXISTS "Users can view their tenant's audit logs" ON audit_logs;
CREATE POLICY "Users can view their tenant's audit logs" ON audit_logs
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "Super admins can manage all audit logs" ON audit_logs;
CREATE POLICY "Super admins can manage all audit logs" ON audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Políticas para support_tickets
DROP POLICY IF EXISTS "Users can view their tenant's tickets" ON support_tickets;
CREATE POLICY "Users can view their tenant's tickets" ON support_tickets
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "Users can create tickets for their tenant" ON support_tickets;
CREATE POLICY "Users can create tickets for their tenant" ON support_tickets
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "Super admins can manage all tickets" ON support_tickets;
CREATE POLICY "Super admins can manage all tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Políticas para support_messages
DROP POLICY IF EXISTS "Users can view messages for their tenant's tickets" ON support_messages;
CREATE POLICY "Users can view messages for their tenant's tickets" ON support_messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

DROP POLICY IF EXISTS "Users can create messages for their tenant's tickets" ON support_messages;
CREATE POLICY "Users can create messages for their tenant's tickets" ON support_messages
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all messages" ON support_messages;
CREATE POLICY "Super admins can manage all messages" ON support_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Políticas para system_metrics
DROP POLICY IF EXISTS "Super admins can manage all metrics" ON system_metrics;
CREATE POLICY "Super admins can manage all metrics" ON system_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Políticas para system_settings
DROP POLICY IF EXISTS "Super admins can manage all settings" ON system_settings;
CREATE POLICY "Super admins can manage all settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Public settings are readable by all" ON system_settings;
CREATE POLICY "Public settings are readable by all" ON system_settings
  FOR SELECT USING (is_public = true);
