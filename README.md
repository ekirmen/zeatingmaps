# Zeatingmaps Setup Instructions

This project contains a backend (Node.js/Express) and a frontend (React). To run the development server you need to install the dependencies in all three locations: root, `backend` and `frontend`.

```bash
# install root dependencies (for concurrent scripts)
npm install

# install backend dependencies
cd backend
npm install

# install frontend dependencies
cd ../frontend
npm install
```

Once installations are complete you can start both servers with:

```bash
npm run start:all
```

This runs the backend with `nodemon` and the frontend with `react-scripts`.

## Environment Variables

Create a `.env` file inside `backend` with at least the following variables:

```ini
MONGO_URI=mongodb://localhost:27017/tickera
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=user@example.com
EMAIL_PASS=your_password
```

When `EMAIL_PORT` is set to `465` (for example when using Gmail's SSL
endpoint), the service will automatically enable secure connections. In that
case you must also set `EMAIL_SECURE=true`.

For the frontend create `frontend/.env`:

```ini
REACT_APP_API_URL=http://localhost:5000
```
