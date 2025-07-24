-- Enable realtime replication of seat_locks changes
-- Adds the table to the supabase_realtime publication so changes
-- broadcast to clients subscribing via the Supabase realtime API.
-- Also set REPLICA IDENTITY to FULL to capture updated rows.

-- ensure publication exists (created by supabase by default)
ALTER PUBLICATION supabase_realtime ADD TABLE seat_locks;

-- replicate old row data on updates
ALTER TABLE seat_locks REPLICA IDENTITY FULL;
