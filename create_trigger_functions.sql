-- Funciones de trigger para el sistema de boletería
-- Ejecutar estas funciones en Supabase SQL Editor

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
        SELECT 
            z.nombre as zona_nombre,
            z.id as zona_id
        INTO zona_info
        FROM mapas m
        JOIN contenido c ON m.id = c.mapa_id
        JOIN sillas s ON c.id = s.contenido_id
        JOIN zonas z ON s.zona_id = z.id
        WHERE s.id = NEW.seat_id
        LIMIT 1;
        
        -- Actualizar información de zona si se encuentra
        IF zona_info IS NOT NULL THEN
            NEW.zona_nombre := zona_info.zona_nombre;
            NEW.zona_id := zona_info.zona_id;
        END IF;
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
