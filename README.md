# Zeating Maps

This project now stores data in **Supabase** instead of MongoDB. A Google Maps API key is required to accurately geocode addresses when creating or editing "recintos" (venues).

## Installation

1. Install dependencies in both the backend and its bundled frontend:
   ```bash
   cd backend && npm install
   cd frontend && npm install  # from inside backend
   ```
2. Copy `backend/frontend/.env.example` to `backend/frontend/.env` and provide values for:
   - `REACT_APP_API_URL` – URL of the backend (e.g. `http://localhost:5000`)
   - `REACT_APP_GOOGLE_MAPS_API_KEY` – your Google Maps API key
3. Copy `backend/.env.example` to `backend/.env` and provide values for:
   - `SUPABASE_URL` – your Supabase project URL
   - `SUPABASE_KEY` – Supabase API key
   - `JWT_SECRET` – secret key for JWT tokens
   - `FRONTEND_URL` – allowed origin for CORS
4. For development, run the frontend and backend using `npm run start:all` from the repository root.

To serve the React application from the same Express server in production:

```bash
npm run build       # builds the frontend
npm start           # starts the backend which now serves the built frontend
```

The Google Maps API key is optional. If not provided, the application will fall back to OpenStreetMap for geocoding.

If an address cannot be resolved, the geocoder now performs a secondary search
using "Hesperia WTC Valencia, Carabobo, Venezuela" as a known reference point.

## Deploying to Vercel

1. Push this repository to GitHub if it is not already there.
2. In the [Vercel](https://vercel.com/) dashboard, create a new project from the GitHub repo.
3. Add the environment variables shown in the `.env.example` files to the Vercel configuration:
   - `SUPABASE_URL` and `SUPABASE_KEY`
   - `JWT_SECRET`
   - `FRONTEND_URL`
   - `REACT_APP_API_URL`
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
4. Trigger a deployment. Vercel will build the React frontend and run the Node backend using `vercel.json`.

## Using Supabase Auth

Supabase provides an authentication service that can replace the local `users` table. The
frontend already exposes a `supabase` client under `src/lib/supabaseClient.js`. A basic
sign-up example looks like this:

```javascript
import { supabase } from './lib/supabaseClient';

const signUp = async (email, password) => {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) console.error('Sign up error', error);
};

const signIn = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) console.error('Sign in error', error);
};
```

You can call these functions from your login or registration forms to authenticate users
directly with Supabase.
