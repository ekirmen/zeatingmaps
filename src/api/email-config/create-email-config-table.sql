-- Crear tabla de configuración de correo por empresa
CREATE TABLE IF NOT EXISTS email_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  empresa_nombre VARCHAR(255) NOT NULL,
  
  -- Configuración SMTP
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_secure BOOLEAN DEFAULT true, -- true para SSL/TLS
  
  -- Credenciales
  smtp_user VARCHAR(255) NOT NULL,
  smtp_password VARCHAR(255) NOT NULL,
  
  -- Configuración del remitente
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) NOT NULL,
  
  -- Configuración adicional
  reply_to_email VARCHAR(255),
  reply_to_name VARCHAR(255),
  
  -- Estado y metadatos
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Restricciones
  CONSTRAINT unique_tenant_email_config UNIQUE(tenant_id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_email_config_tenant_id ON email_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_config_active ON email_config(is_active);

-- Habilitar RLS
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;

-- Política RLS para que cada empresa solo vea su configuración
CREATE POLICY "Users can view own company email config" ON email_config
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can insert own company email config" ON email_config
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can update own company email config" ON email_config
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can delete own company email config" ON email_config
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_email_config_updated_at 
  BEFORE UPDATE ON email_config 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
