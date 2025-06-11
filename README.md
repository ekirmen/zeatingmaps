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
