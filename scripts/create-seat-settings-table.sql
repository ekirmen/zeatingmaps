-- Crear tabla para configuraciones de asientos
CREATE TABLE IF NOT EXISTS public.seat_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  event_id uuid NULL, -- NULL para configuraciones globales del tenant
  lock_expiration_minutes integer NOT NULL DEFAULT 15,
  preserve_time_minutes integer NOT NULL DEFAULT 5,
  warning_time_minutes integer NOT NULL DEFAULT 3,
  enable_auto_cleanup boolean NOT NULL DEFAULT true,
  cleanup_interval_minutes integer NOT NULL DEFAULT 5,
  enable_notifications boolean NOT NULL DEFAULT true,
  enable_restoration boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT seat_settings_pkey PRIMARY KEY (id),
  CONSTRAINT seat_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT seat_settings_event_id_fkey FOREIGN KEY (event_id) REFERENCES eventos(id) ON DELETE CASCADE,
  CONSTRAINT seat_settings_tenant_event_unique UNIQUE (tenant_id, event_id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_seat_settings_tenant_id ON public.seat_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seat_settings_event_id ON public.seat_settings(event_id);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_seat_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trigger_update_seat_settings_updated_at ON public.seat_settings;
CREATE TRIGGER trigger_update_seat_settings_updated_at
  BEFORE UPDATE ON public.seat_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_seat_settings_updated_at();

-- Crear función RPC para obtener configuraciones de asientos
CREATE OR REPLACE FUNCTION get_seat_settings(
  p_tenant_id uuid,
  p_event_id uuid DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Buscar configuración específica del evento primero
  IF p_event_id IS NOT NULL THEN
    SELECT json_build_object(
      'lock_expiration_minutes', lock_expiration_minutes,
      'preserve_time_minutes', preserve_time_minutes,
      'warning_time_minutes', warning_time_minutes,
      'enable_auto_cleanup', enable_auto_cleanup,
      'cleanup_interval_minutes', cleanup_interval_minutes,
      'enable_notifications', enable_notifications,
      'enable_restoration', enable_restoration
    ) INTO result
    FROM public.seat_settings
    WHERE tenant_id = p_tenant_id AND event_id = p_event_id;
  END IF;
  
  -- Si no hay configuración específica del evento, buscar configuración global del tenant
  IF result IS NULL THEN
    SELECT json_build_object(
      'lock_expiration_minutes', lock_expiration_minutes,
      'preserve_time_minutes', preserve_time_minutes,
      'warning_time_minutes', warning_time_minutes,
      'enable_auto_cleanup', enable_auto_cleanup,
      'cleanup_interval_minutes', cleanup_interval_minutes,
      'enable_notifications', enable_notifications,
      'enable_restoration', enable_restoration
    ) INTO result
    FROM public.seat_settings
    WHERE tenant_id = p_tenant_id AND event_id IS NULL;
  END IF;
  
  -- Si no hay configuración del tenant, devolver valores por defecto
  IF result IS NULL THEN
    result := json_build_object(
      'lock_expiration_minutes', 15,
      'preserve_time_minutes', 5,
      'warning_time_minutes', 3,
      'enable_auto_cleanup', true,
      'cleanup_interval_minutes', 5,
      'enable_notifications', true,
      'enable_restoration', true
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función RPC para guardar configuraciones de asientos
CREATE OR REPLACE FUNCTION save_seat_settings(
  p_tenant_id uuid,
  p_event_id uuid DEFAULT NULL,
  p_lock_expiration_minutes integer DEFAULT 15,
  p_preserve_time_minutes integer DEFAULT 5,
  p_warning_time_minutes integer DEFAULT 3,
  p_enable_auto_cleanup boolean DEFAULT true,
  p_cleanup_interval_minutes integer DEFAULT 5,
  p_enable_notifications boolean DEFAULT true,
  p_enable_restoration boolean DEFAULT true
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Insertar o actualizar configuración
  INSERT INTO public.seat_settings (
    tenant_id,
    event_id,
    lock_expiration_minutes,
    preserve_time_minutes,
    warning_time_minutes,
    enable_auto_cleanup,
    cleanup_interval_minutes,
    enable_notifications,
    enable_restoration
  ) VALUES (
    p_tenant_id,
    p_event_id,
    p_lock_expiration_minutes,
    p_preserve_time_minutes,
    p_warning_time_minutes,
    p_enable_auto_cleanup,
    p_cleanup_interval_minutes,
    p_enable_notifications,
    p_enable_restoration
  )
  ON CONFLICT (tenant_id, event_id)
  DO UPDATE SET
    lock_expiration_minutes = EXCLUDED.lock_expiration_minutes,
    preserve_time_minutes = EXCLUDED.preserve_time_minutes,
    warning_time_minutes = EXCLUDED.warning_time_minutes,
    enable_auto_cleanup = EXCLUDED.enable_auto_cleanup,
    cleanup_interval_minutes = EXCLUDED.cleanup_interval_minutes,
    enable_notifications = EXCLUDED.enable_notifications,
    enable_restoration = EXCLUDED.enable_restoration,
    updated_at = now();
  
  -- Devolver la configuración guardada
  SELECT get_seat_settings(p_tenant_id, p_event_id) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear políticas RLS para la tabla seat_settings
ALTER TABLE public.seat_settings ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver configuraciones de su tenant
DROP POLICY IF EXISTS "Users can view seat settings for their tenant" ON public.seat_settings;
CREATE POLICY "Users can view seat settings for their tenant" ON public.seat_settings
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Política para que los usuarios solo puedan insertar/actualizar configuraciones de su tenant
DROP POLICY IF EXISTS "Users can insert/update seat settings for their tenant" ON public.seat_settings;
CREATE POLICY "Users can insert/update seat settings for their tenant" ON public.seat_settings
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Insertar configuración por defecto para tenants existentes (opcional)
-- INSERT INTO public.seat_settings (tenant_id, lock_expiration_minutes, preserve_time_minutes, warning_time_minutes)
-- SELECT id, 15, 5, 3 FROM public.tenants WHERE id NOT IN (SELECT tenant_id FROM public.seat_settings);

COMMENT ON TABLE public.seat_settings IS 'Configuraciones de tiempo de expiración y limpieza de asientos por tenant y evento';
COMMENT ON COLUMN public.seat_settings.tenant_id IS 'ID del tenant propietario de la configuración';
COMMENT ON COLUMN public.seat_settings.event_id IS 'ID del evento específico (NULL para configuración global del tenant)';
COMMENT ON COLUMN public.seat_settings.lock_expiration_minutes IS 'Tiempo total de bloqueo de asientos en minutos';
COMMENT ON COLUMN public.seat_settings.preserve_time_minutes IS 'Tiempo de preservación de asientos al regresar en minutos';
COMMENT ON COLUMN public.seat_settings.warning_time_minutes IS 'Tiempo de advertencia antes de expirar en minutos';
COMMENT ON COLUMN public.seat_settings.enable_auto_cleanup IS 'Habilitar limpieza automática de asientos abandonados';
COMMENT ON COLUMN public.seat_settings.cleanup_interval_minutes IS 'Intervalo de ejecución de limpieza automática en minutos';
COMMENT ON COLUMN public.seat_settings.enable_notifications IS 'Habilitar notificaciones de estado de asientos';
COMMENT ON COLUMN public.seat_settings.enable_restoration IS 'Habilitar restauración automática de asientos al regresar';
