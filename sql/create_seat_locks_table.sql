-- SQL schema for simple seat locking
-- Each row represents a locked seat identified by its UUID.
-- The row is removed when the seat is unlocked.
CREATE TABLE IF NOT EXISTS seat_locks (
    seat_id uuid PRIMARY KEY,
    status text NOT NULL DEFAULT 'bloqueado',
    locked_at timestamp with time zone DEFAULT now()
);
