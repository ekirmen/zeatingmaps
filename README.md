# Zeating Maps

This project is a React application that relies on Supabase for data storage and authentication. To run it locally you will need to provide your own Supabase credentials.

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase credentials. You can also
   set custom bucket names and optional folders for uploaded images:

   ```bash
   cp .env.example .env
   # Edit .env and provide your values
   # You may specify REACT_APP_EVENT_BUCKET and REACT_APP_LOGO_BUCKET
   # along with REACT_APP_EVENT_FOLDER or REACT_APP_LOGO_FOLDER to
   # organize uploaded files in Storage. Bucket names and folders
   # should not include leading or trailing slashes.
   # Event images are uploaded inside a subfolder with the event ID so
   # each event keeps its own directory.
   ```

   Set `REACT_APP_SITE_URL` to your deployed domain so Supabase emails point to the correct host.
   The `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` variable (or its alias
   `REACT_SUPABASE_SERVICE_ROLE_KEY`) is optional but required
   for administrative actions such as blocking seats. Without it, updates may be
   rejected by Supabase if your anonymous role lacks `UPDATE` privileges.

3. Start the development server:

   ```bash
   npm start
   ```

## Fetching users

Use the helper in `src/services/userService.js` to retrieve the list of users with fields such as `login`, `email`, `telefono`, `empresa`, `perfil` and `permisos`:

```javascript
import { fetchUsers } from './services/userService';

fetchUsers().then(console.log).catch(console.error);
```

The request is executed with the Supabase client configured via the `.env` variables, so it adheres to any row level security policies defined in your Supabase project.

## Admin operations

Certain backoffice components use `supabase.auth.admin` to create users. These calls require the **Service Role Key**. If `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` (or `REACT_SUPABASE_SERVICE_ROLE_KEY`) is not provided or is invalid, the request will fail with a `403` error when hitting `auth/v1/admin` endpoints.

For development you can add the key to your `.env` file:

```bash
# You can also set REACT_SUPABASE_SERVICE_ROLE_KEY
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

This key grants full access to your Supabase project, so avoid exposing it in production builds and prefer performing admin tasks on a secure server.


## Database

The project expects a table named `entradas` in Supabase. An example schema is provided in `sql/create_entradas_table.sql`.
It defines standard ticket fields, including a `recinto` column referencing the venue and a `nombre_entrada` column for the ticket name. The example no longer includes an `evento_id` field.

To easily fetch profile data together with the user's email, create the `profiles_with_auth` view using the script in `sql/create_profiles_with_auth_view.sql`:

```sql
-- Run inside the SQL editor
CREATE OR REPLACE VIEW public.profiles_with_auth AS
SELECT p.id, p.login, p.nombre, p.apellido, p.telefono, p.empresa, u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id;
```

Queries can then reference `profiles_with_auth` to retrieve profile fields and email in a single call.

A `payments` table is also required to store ticket sales. The example schema in
`sql/create_payments_table.sql` includes a `usuario_id` column for the customer
and a `processed_by` field to track the user that processed the sale. Both
columns reference `profiles.id` so you can easily join payment records with user
profiles. The table also includes an `event` column referencing `eventos.id`.

## Seat utilities

The `src/utils/isUuid.js` helper verifies whether a string is a valid UUID. Use it when calling `updateSeat` to prevent typos in seat IDs:

```javascript
import { updateSeat } from './backoffice/services/supabaseSeats';
import { isUuid } from './utils/isUuid';

if (isUuid(seatId)) {
  await updateSeat(seatId, {/* your updates */});
}
```

Blocking or unblocking seats also updates the `seats` table. Make sure
`REACT_APP_SUPABASE_SERVICE_ROLE_KEY` (or `REACT_SUPABASE_SERVICE_ROLE_KEY`) is defined or your anonymous role has
`UPDATE` privileges; otherwise these changes won't persist.

## Seat locking table

A minimal table named `seat_locks` can be used to keep track of blocked seats. Each row stores the seat UUID and its current status. When a seat is unlocked the row is simply removed. An example schema is provided in `sql/create_seat_locks_table.sql`.

The helper functions `lockSeat` and `unlockSeat` are available in `src/backoffice/services/seatLocks.js`:

```javascript
import { lockSeat, unlockSeat } from './backoffice/services/seatLocks';

await lockSeat(seatId);      // Adds the seat to the locking table
await unlockSeat(seatId);    // Removes the seat from the table
```
