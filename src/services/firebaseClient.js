import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { supabase } from '../supabaseClient';

let firebaseApp = null;
let database = null;
let useFirebase = false;

const loadSettingsConfig = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', [
      'firebase-api-key',
      'firebase-auth-domain',
      'firebase-db-url',
      'firebase-use',
    ]);
  if (error) {
    console.error('[firebaseClient] Error loading settings', error);
    return null;
  }
  const map = Object.fromEntries(data?.map((r) => [r.key, r.value]) || []);
  return {
    useFirebase: map['firebase-use'] === 'true',
    apiKey: map['firebase-api-key'],
    authDomain: map['firebase-auth-domain'],
    databaseURL: map['firebase-db-url'],
  };
};

const getEnvConfig = () => ({
  useFirebase: process.env.REACT_APP_USE_FIREBASE === 'true',
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
});

export const initFirebase = (config = null) => {
  if (firebaseApp) return { firebaseApp, database };
  const cfg = config || getEnvConfig();
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
    let instance = initFirebase();
    if (!instance) {
      const cfg = await loadSettingsConfig();
      if (cfg) {
        instance = initFirebase(cfg);
      }
    }
  }
  return useFirebase ? database : null;
};
