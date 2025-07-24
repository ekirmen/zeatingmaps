-- SQL schema for simple seat locking
-- Each row represents a locked seat identified by its UUID.
-- The row is removed when the seat is unlocked.
CREATE TABLE IF NOT EXISTS seat_locks (
    seat_id uuid NOT NULL,
    funcion_id integer NOT NULL REFERENCES funciones(id) ON DELETE CASCADE,
    session_id uuid,
    status text NOT NULL DEFAULT 'seleccionado',
    locked_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (funcion_id, seat_id)
);
