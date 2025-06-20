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

