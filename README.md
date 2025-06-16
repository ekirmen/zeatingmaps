# Zeating Maps

This project requires a Google Maps API key to accurately geocode addresses when creating or editing "recintos" (venues).

1. Copy `frontend/.env.example` to `frontend/.env` and fill in your API URL and Google Maps API key.
2. Run the frontend and backend using `npm run start:all` from the repository root.

The Google Maps API key is optional. If not provided, the application will fall back to OpenStreetMap for geocoding.

If an address cannot be resolved, the geocoder now performs a secondary search
using "Hesperia WTC Valencia, Carabobo, Venezuela" as a known reference point.
