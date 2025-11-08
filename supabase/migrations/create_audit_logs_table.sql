-- Crear tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(255) NOT NULL,
  details JSONB,
  metadata JSONB,
  resource_id UUID,
  resource_type VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  url TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON public.audit_logs(session_id);

-- Índice compuesto para consultas comunes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON public.audit_logs(tenant_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver logs de su tenant
CREATE POLICY "Users can view audit logs of their tenant"
  ON public.audit_logs
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- Política: Solo el sistema puede insertar logs (a través de service role)
-- Los usuarios autenticados también pueden insertar sus propios logs
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      tenant_id IN (
        SELECT tenant_id FROM public.profiles 
        WHERE id = auth.uid()
      )
      OR user_id = auth.uid()
    )
  );

-- Función para limpiar logs antiguos (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Eliminar logs con más de 1 año de antigüedad (excepto críticos)
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year'
    AND severity != 'critical';
  
  -- Eliminar logs de info con más de 6 meses
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '6 months'
    AND severity = 'info';
END;
$$;

-- Comentarios
COMMENT ON TABLE public.audit_logs IS 'Registro completo de acciones del sistema para auditoría y trazabilidad';
COMMENT ON COLUMN public.audit_logs.action IS 'Tipo de acción realizada (ej: payment_created, seat_locked, user_login)';
COMMENT ON COLUMN public.audit_logs.details IS 'Detalles de la acción en formato JSON';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Metadatos adicionales en formato JSON';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'ID del recurso afectado';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'Tipo de recurso (payment_transaction, seat, user, etc.)';
COMMENT ON COLUMN public.audit_logs.severity IS 'Nivel de severidad (info, warning, error, critical)';
COMMENT ON COLUMN public.audit_logs.session_id IS 'ID de sesión del usuario';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'Dirección IP del cliente';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'User agent del navegador';

