# Zeating Maps

This project is a React application that relies on Supabase for data storage and authentication. To run it locally you will need to provide your own Supabase credentials.

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with the following variables:

   ```bash
   REACT_APP_SUPABASE_URL=<your-supabase-url>
   REACT_APP_SUPABASE_ANON_KEY=<your-anon-key>
   REACT_APP_SUPABASE_SERVICE_ROLE_KEY=<service-role-key-if-needed>
   # Base URL for the REST API used by the store and backoffice
   REACT_APP_API_URL=<your-api-url>
   ```

3. Start the development server:

   ```bash
   npm start
   ```

## Fetching users

Use the helper in `src/services/userService.js` to retrieve the list of users with fields such as `login`, `email`, `telefono`, `empresa`, `perfil`, `permisos` and `formaDePago`:

```javascript
import { fetchUsers } from './services/userService';

fetchUsers().then(console.log).catch(console.error);
```

The request is executed with the Supabase client configured via the `.env` variables, so it adheres to any row level security policies defined in your Supabase project.

## Admin operations

Certain backoffice components use `supabase.auth.admin` to create users. These calls require the **Service Role Key**. If `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` is not provided or is invalid, the request will fail with a `403` error when hitting `auth/v1/admin` endpoints.

For development you can add the key to your `.env` file:

```bash
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

This key grants full access to your Supabase project, so avoid exposing it in production builds and prefer performing admin tasks on a secure server.

