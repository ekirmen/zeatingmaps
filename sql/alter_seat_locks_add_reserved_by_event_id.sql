-- Migration to add reserved_by and event_id columns to seat_locks table
ALTER TABLE seat_locks
ADD COLUMN IF NOT EXISTS reserved_by uuid,
ADD COLUMN IF NOT EXISTS event_id uuid;
