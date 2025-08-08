-- Tabla para formularios personalizados
CREATE TABLE IF NOT EXISTS custom_forms (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para respuestas de formularios
CREATE TABLE IF NOT EXISTS form_responses (
  id SERIAL PRIMARY KEY,
  form_id INTEGER REFERENCES custom_forms(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES usuarios(id),
  event_id UUID REFERENCES eventos(id),
  responses JSONB NOT NULL DEFAULT '[]',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para configuración de MailChimp
CREATE TABLE IF NOT EXISTS mailchimp_configs (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  api_key VARCHAR(255),
  list_id VARCHAR(255),
  audience_name VARCHAR(255),
  auto_subscribe BOOLEAN DEFAULT true,
  double_opt_in BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]',
  merge_fields JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para suscripciones de MailChimp
CREATE TABLE IF NOT EXISTS mailchimp_subscriptions (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES eventos(id),
  customer_id UUID REFERENCES usuarios(id),
  email VARCHAR(255) NOT NULL,
  mailchimp_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para configuración de notificaciones push
CREATE TABLE IF NOT EXISTS push_notifications_config (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  target VARCHAR(50) DEFAULT 'all',
  scheduled BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para historial de notificaciones push
CREATE TABLE IF NOT EXISTS push_notifications (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES eventos(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  target VARCHAR(50) DEFAULT 'all',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_custom_forms_event_id ON custom_forms(event_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_customer_id ON form_responses(customer_id);
CREATE INDEX IF NOT EXISTS idx_mailchimp_configs_event_id ON mailchimp_configs(event_id);
CREATE INDEX IF NOT EXISTS idx_mailchimp_subscriptions_event_id ON mailchimp_subscriptions(event_id);
CREATE INDEX IF NOT EXISTS idx_mailchimp_subscriptions_email ON mailchimp_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_push_notifications_config_event_id ON push_notifications_config(event_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_event_id ON push_notifications(event_id);

-- Políticas de seguridad RLS
ALTER TABLE custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailchimp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailchimp_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para custom_forms
CREATE POLICY "Users can view custom forms" ON custom_forms
  FOR SELECT USING (true);

CREATE POLICY "Event organizers can manage custom forms" ON custom_forms
  FOR ALL USING (true);

-- Políticas para form_responses
CREATE POLICY "Users can view their own form responses" ON form_responses
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Event organizers can view form responses" ON form_responses
  FOR SELECT USING (true);

CREATE POLICY "Users can insert form responses" ON form_responses
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Políticas para mailchimp_configs
CREATE POLICY "Event organizers can manage mailchimp configs" ON mailchimp_configs
  FOR ALL USING (true);

-- Políticas para mailchimp_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON mailchimp_subscriptions
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Event organizers can view subscriptions" ON mailchimp_subscriptions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert subscriptions" ON mailchimp_subscriptions
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Políticas para push_notifications_config
CREATE POLICY "Event organizers can manage push notifications config" ON push_notifications_config
  FOR ALL USING (true);

-- Políticas para push_notifications
CREATE POLICY "Event organizers can view push notifications" ON push_notifications
  FOR SELECT USING (true);

CREATE POLICY "Event organizers can insert push notifications" ON push_notifications
  FOR INSERT WITH CHECK (true);
