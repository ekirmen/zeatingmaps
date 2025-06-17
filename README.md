# Zeating Maps

This project now stores data in **Supabase** instead of MongoDB. A Google Maps API key is required to accurately geocode addresses when creating or editing "recintos" (venues).

## Installation

1. Install dependencies in both the backend and frontend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Copy `frontend/.env.example` to `frontend/.env` and provide values for:
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
