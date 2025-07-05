# Zeating Maps

This project is a React application that relies on Supabase for data storage and authentication. To run it locally you will need to provide your own Supabase credentials.

The production instance is hosted at **https://zeatingmaps-ekirmens-projects.vercel.app**. The backoffice ticketing module can now be accessed from **/dashboard/Boleteria** on that domain. Older links pointing to `https://zeatingmaps-backend.vercel.app/api/payments/&lt;locator&gt;/download` no longer exist and should be replaced with the new dashboard URL.

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

If you plan to use Firebase for seat locking, set the Firebase
environment variables in your `.env` file or add them to the `settings`
table in Supabase:

```bash
REACT_APP_FIREBASE_API_KEY=<your-key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<your-domain>
REACT_APP_FIREBASE_DB_URL=<your-db-url>
```

The application now detects Firebase configuration automatically at runtime.
No build-time flag is required for synchronization across browser tabs.

Your Firebase Realtime Database must also allow both reads and writes on the
paths used for seat locks. A minimal example:

```json
{
  "rules": {
    "reserved": {
      "$chart_id": { ".indexOn": "timestamp" }
    },
    "in-cart": {
      "$chart_id": {
        "$seat": { ".indexOn": "timestamp" }
      }
    },
    ".read": true,
    ".write": true
  }
}
```

Set `REACT_APP_SITE_URL` to your deployed domain so Supabase emails point to
the correct host. If your application is served from a subfolder (for example
`/store`), include that path here:

   ```bash
REACT_APP_SITE_URL=https://your-domain.com/store
```

If your backend runs on a different domain, also set `REACT_APP_API_URL`. This
variable should contain **only the domain**, without any additional path. In
production the API is hosted at:

```bash
REACT_APP_API_URL=https://zeatingmaps-ekirmens-projects.vercel.app
```

For example, `https://zeatingmaps-ekirmens-projects.vercel.app` is correct but
`https://zeatingmaps-ekirmens-projects.vercel.app/dashboard/Boleteria` will
break ticket downloads.

To ensure static assets load correctly from that subfolder, also update the
`homepage` field in your `package.json`:

```json
  "homepage": "/store"
```

Add this line near the top of `package.json` so `npm run build` generates
paths relative to `/store` instead of `/`.

   The **Site URL** in your Supabase Dashboard should only contain the domain
   (no path). Update it under **Settings → Auth → URL Configuration** to match
   your domain; otherwise recovery or confirmation emails may still link back to
   `http://localhost:3000`.
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
Additional optional fields like `referrer`, `discountCode` and
`reservationDeadline` allow you to track affiliate sources, applied discounts and
reservation expiry times.

Seats for each function are stored in a separate `seats` table. The schema in
`sql/create_seats_table.sql` enforces a unique `(_id, funcion_id)` pair so the
same seat cannot be inserted twice for a single function. This helps prevent the
sale of duplicate tickets when multiple users try to purchase the same seat.

To receive realtime updates from Supabase you must add the table to the
`supabase_realtime` publication after creating it. Run the following SQL inside
your project:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE seats;
```

The table must also be configured with `REPLICA IDENTITY FULL` so realtime
events include all columns:

```sql
ALTER TABLE seats REPLICA IDENTITY FULL;
```

Existing realtime subscriptions may need to reconnect for the setting to take effect.

To power the web studio CMS, create a `cms_pages` table. The
`sql/create_cms_pages_table.sql` script defines the basic schema including a
`slug` column and inserts the default `home` and `events` pages expected by the
application. Pages are looked up by slug, falling back to the legacy `nombre`
field if it exists.

The backoffice also stores configuration values in a small `settings`
table. Create it using the script in `sql/create_settings_table.sql`. It
contains just `key` and `value` columns and is used to persist options
such as the Firebase credentials or the cart seat expiration time.

### Testing the Firebase connection

After configuring the credentials you can verify the integration by visiting
`/dashboard/firebase-test` while the app is running. The page writes to Firebase
using the client SDK and shows the JSON response so you can confirm that your
credentials are correct. Open your browser's console to see the request and
response logs from the page.

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

await lockSeat(seatId, 'bloqueado', funcionId); // Adds the seat to the locking table
await unlockSeat(seatId, funcionId);            // Removes the seat from the table
```
## Seat synchronization

Use the `syncSeatsForSala` helper to populate the `seats` table after creating or importing a map. A small script is available:

```bash
node scripts/syncSeatsForSala.mjs <sala_id>
```

This reads the map for the given hall and inserts any missing seat records for all of its functions.

## Pruebas en Vercel

Si quieres ejecutar `npm test --silent` en Vercel como parte del despliegue,
agrega este script en tu `package.json`:

```json
  "vercel-build": "npm install && npm test --silent && npm run build"
```

Luego define `npm run vercel-build` como **Build Command** en la configuración
del proyecto de Vercel. De esta forma se instalan las dependencias, se ejecutan
los tests y finalmente se genera el build de producción.

Última edición: redeploy for vercel
