import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

let firebaseApp = null;
let database = null;
let useFirebase = false;

const getEnvConfig = () => ({
  useFirebase: process.env.REACT_APP_USE_FIREBASE === 'true',
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
});

export const initFirebase = () => {
  if (firebaseApp) return { firebaseApp, database };
  const cfg = getEnvConfig();
  if (!cfg.useFirebase) return null;

  if (!cfg.apiKey || !cfg.authDomain || !cfg.databaseURL) {
    console.warn('Missing Firebase configuration.');
    return null;
  }

  firebaseApp = initializeApp({
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain,
    databaseURL: cfg.databaseURL,
  });
  database = getDatabase(firebaseApp);
  useFirebase = true;
  return { firebaseApp, database };
};

export const getDatabaseInstance = async () => {
  if (!firebaseApp && !useFirebase) {
    initFirebase();
  }
  return useFirebase ? database : null;
};
