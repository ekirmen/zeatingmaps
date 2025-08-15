-- Crear tabla para registrar envíos de emails de tickets
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_email_logs_payment_id ON email_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);

-- Habilitar RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Política RLS para que solo los usuarios autenticados puedan ver los logs
CREATE POLICY "Users can view their own email logs" ON email_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política RLS para que solo los usuarios autenticados puedan insertar logs
CREATE POLICY "Users can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_email_logs_updated_at 
  BEFORE UPDATE ON email_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios de la tabla
COMMENT ON TABLE email_logs IS 'Registro de envíos de emails de tickets';
COMMENT ON COLUMN email_logs.payment_id IS 'ID del pago relacionado';
COMMENT ON COLUMN email_logs.recipient_email IS 'Email del destinatario';
COMMENT ON COLUMN email_logs.subject IS 'Asunto del email';
COMMENT ON COLUMN email_logs.status IS 'Estado del envío: sent, failed, pending';
COMMENT ON COLUMN email_logs.sent_at IS 'Fecha y hora del envío';
COMMENT ON COLUMN email_logs.error_message IS 'Mensaje de error si falló el envío';
COMMENT ON COLUMN email_logs.retry_count IS 'Número de intentos de reenvío';
