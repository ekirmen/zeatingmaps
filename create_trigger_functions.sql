-- Funciones de trigger para el sistema de boletería
-- Ejecutar estas funciones en Supabase SQL Editor

-- 1. Crear tabla seat_locks si no existe
CREATE TABLE IF NOT EXISTS public.seat_locks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seat_id text NULL,
  table_id text NULL,
  funcion_id integer NOT NULL,
  session_id text NULL,
  locked_at timestamp with time zone NULL DEFAULT now(),
  expires_at timestamp with time zone NULL,
  status text NULL DEFAULT 'locked'::text,
  lock_type text NULL DEFAULT 'seat'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  tenant_id uuid NULL,
  locator character varying(255) NULL,
  user_id uuid NULL,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  zona_id character varying(255) NULL,
  zona_nombre character varying(255) NULL,
  precio numeric(10, 2) NULL,
  CONSTRAINT seat_locks_pkey PRIMARY KEY (id),
  CONSTRAINT seat_locks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  CONSTRAINT seat_locks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Crear índices para seat_locks
CREATE INDEX IF NOT EXISTS idx_seat_locks_funcion_id ON public.seat_locks USING btree (funcion_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_seat_locks_session_id ON public.seat_locks USING btree (session_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_seat_locks_seat_id ON public.seat_locks USING btree (seat_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_seat_locks_table_id ON public.seat_locks USING btree (table_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_seat_locks_expires_at ON public.seat_locks USING btree (expires_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_seat_locks_lock_type ON public.seat_locks USING btree (lock_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_seat_locks_tenant_id ON public.seat_locks USING btree (tenant_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_seat_locks_locator ON public.seat_locks USING btree (locator) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_seat_locks_user_id ON public.seat_locks USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_seat_locks_zona_id ON public.seat_locks USING btree (zona_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_seat_locks_zona_nombre ON public.seat_locks USING btree (zona_nombre) TABLESPACE pg_default;

-- 1. Función para validar disponibilidad de asientos
CREATE OR REPLACE FUNCTION validate_seat_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar si el asiento ya está vendido
    IF EXISTS (
        SELECT 1 FROM payments 
        WHERE funcion = NEW.funcion 
        AND status = 'pagado'
        AND seats @> jsonb_build_array(jsonb_build_object('id', (NEW.seats->0->>'id')))
    ) THEN
        RAISE EXCEPTION 'El asiento ya está vendido';
    END IF;
    
    -- Verificar si el asiento está bloqueado
    IF EXISTS (
        SELECT 1 FROM seat_locks 
        WHERE funcion_id = NEW.funcion 
        AND seat_id = (NEW.seats->0->>'id')
        AND status = 'locked'
        AND expires_at > NOW()
    ) THEN
        RAISE EXCEPTION 'El asiento está bloqueado';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para establecer el usuario del pago
CREATE OR REPLACE FUNCTION set_payment_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Si no hay usuario_id pero hay user_id, copiar user_id a usuario_id
    IF NEW.usuario_id IS NULL AND NEW.user_id IS NOT NULL THEN
        NEW.usuario_id := NEW.user_id;
    END IF;
    
    -- Si no hay user_id pero hay usuario_id, copiar usuario_id a user_id
    IF NEW.user_id IS NULL AND NEW.usuario_id IS NOT NULL THEN
        NEW.user_id := NEW.usuario_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para actualizar información de zona en seat_locks
CREATE OR REPLACE FUNCTION update_seat_lock_zone_info()
RETURNS TRIGGER AS $$
DECLARE
    seat_data jsonb;
    zona_info record;
BEGIN
    -- Si hay seat_id, buscar información de la zona
    IF NEW.seat_id IS NOT NULL THEN
        -- Buscar información de la zona desde el mapa
        -- Nota: Esta función se simplifica ya que la tabla contenido no existe
        -- La información de zona se puede obtener de otras formas o se puede omitir
        -- Por ahora, establecer valores por defecto
        NEW.zona_nombre := 'General';
        NEW.zona_id := 'general';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para limpiar locks expirados
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
    DELETE FROM seat_locks 
    WHERE expires_at < NOW() 
    AND status = 'locked';
END;
$$ LANGUAGE plpgsql;

-- 5. Función para obtener estado de asiento
CREATE OR REPLACE FUNCTION get_seat_status(seat_id_param text, funcion_id_param integer)
RETURNS text AS $$
DECLARE
    seat_status text := 'disponible';
BEGIN
    -- Verificar si está vendido
    IF EXISTS (
        SELECT 1 FROM payments 
        WHERE funcion = funcion_id_param 
        AND status = 'pagado'
        AND seats @> jsonb_build_array(jsonb_build_object('id', seat_id_param))
    ) THEN
        seat_status := 'vendido';
    -- Verificar si está reservado
    ELSIF EXISTS (
        SELECT 1 FROM payments 
        WHERE funcion = funcion_id_param 
        AND status = 'reservado'
        AND seats @> jsonb_build_array(jsonb_build_object('id', seat_id_param))
    ) THEN
        seat_status := 'reservado';
    -- Verificar si está bloqueado
    ELSIF EXISTS (
        SELECT 1 FROM seat_locks 
        WHERE funcion_id = funcion_id_param 
        AND seat_id = seat_id_param
        AND status = 'locked'
        AND expires_at > NOW()
    ) THEN
        seat_status := 'bloqueado';
    END IF;
    
    RETURN seat_status;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear triggers
-- Trigger para validar disponibilidad de asientos
DROP TRIGGER IF EXISTS check_seat_availability ON payments;
CREATE TRIGGER check_seat_availability 
    BEFORE INSERT OR UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION validate_seat_availability();

-- Trigger para establecer usuario del pago
DROP TRIGGER IF EXISTS set_payment_user_trigger ON payments;
CREATE TRIGGER set_payment_user_trigger 
    BEFORE INSERT ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION set_payment_user();

-- Trigger para actualizar información de zona en seat_locks
DROP TRIGGER IF EXISTS trigger_update_seat_lock_zone_info ON seat_locks;
CREATE TRIGGER trigger_update_seat_lock_zone_info 
    BEFORE INSERT OR UPDATE ON seat_locks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_seat_lock_zone_info();

-- 7. Otorgar permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON seat_locks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON seat_locks TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
