-- Adds the `seats` table to the default Supabase realtime publication so
-- clients receive realtime updates when seat records change.
ALTER PUBLICATION supabase_realtime ADD TABLE seats;
