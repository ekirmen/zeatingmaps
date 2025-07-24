# Zeating Maps

This project is a React application for managing seating maps and seat reservations.

## Seat lock policies

To allow anonymous users (for example when browsing in incognito mode) to view and lock seats, run the migration `sql/allow_anon_access_to_seat_locks.sql` in your Supabase database. It relaxes the row-level security policies on the `seat_locks` table so that inserts, updates and deletes are allowed when a `session_id` is provided. This ensures seat selections appear in real time for all visitors.

## Realtime seat updates

To broadcast changes instantly across all browsers, add the `seat_locks` table to Supabase's realtime publication and enable full replica identity. Run the SQL file `sql/enable_realtime_for_seat_locks.sql` in your database. After applying it, seat selections and releases will stream to subscribed clients so that maps stay in sync.
