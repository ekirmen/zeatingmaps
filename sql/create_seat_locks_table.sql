-- Crear tabla seat_locks para manejar bloqueos de asientos en tiempo real
CREATE TABLE IF NOT EXISTS seat_locks (
    id SERIAL PRIMARY KEY,
    seat_id UUID NOT NULL,
    funcion_id BIGINT NOT NULL,
    session_id TEXT NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'locked',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_seat_locks_seat_id ON seat_locks(seat_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_funcion_id ON seat_locks(funcion_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_session_id ON seat_locks(session_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_expires_at ON seat_locks(expires_at);

-- Crear restricción única para evitar bloqueos duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_seat_locks_unique ON seat_locks(seat_id, funcion_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE seat_locks ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos
CREATE POLICY "Allow read access to seat_locks" ON seat_locks
    FOR SELECT USING (true);

-- Política para permitir inserción/actualización a todos
CREATE POLICY "Allow insert/update access to seat_locks" ON seat_locks
    FOR ALL USING (true);

-- Función para limpiar bloqueos expirados automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_seat_locks()
RETURNS void AS $$
BEGIN
    DELETE FROM seat_locks 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para limpiar bloqueos expirados
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_seat_locks()
RETURNS trigger AS $$
BEGIN
    PERFORM cleanup_expired_seat_locks();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecute antes de insertar/actualizar
CREATE TRIGGER cleanup_expired_seat_locks_trigger
    BEFORE INSERT OR UPDATE ON seat_locks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleanup_expired_seat_locks();
