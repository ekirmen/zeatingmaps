# Zeating Maps

This project contains both the backend API and a React frontend. Development can be run using the npm scripts defined in `package.json`.

## API URL Configuration

Frontend requests rely on the `REACT_APP_API_URL` environment variable. This value should **not** include a trailing `/api` segment. For example:

```
REACT_APP_API_URL=https://example.com
```

The application automatically appends `/api` when calling the backend.
