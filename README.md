# Zeating Maps

This project requires a Google Maps API key to accurately geocode addresses when creating or editing "recintos" (venues).

## Installation

1. Install dependencies in both the backend and frontend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Copy `frontend/.env.example` to `frontend/.env` and provide values for:
   - `REACT_APP_API_URL` – URL of the backend (e.g. `http://localhost:5000`)
   - `REACT_APP_GOOGLE_MAPS_API_KEY` – your Google Maps API key
3. Create a `backend/.env` file with at least:
   - `MONGO_URI` – MongoDB connection string
   - `JWT_SECRET` – secret key for JWT tokens
   - `FRONTEND_URL` – allowed origin for CORS
4. Run the frontend and backend using `npm run start:all` from the repository root.

The Google Maps API key is optional. If not provided, the application will fall back to OpenStreetMap for geocoding.

If an address cannot be resolved, the geocoder now performs a secondary search
using "Hesperia WTC Valencia, Carabobo, Venezuela" as a known reference point.
