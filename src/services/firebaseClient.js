import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { supabase } from '../backoffice/services/supabaseClient';

let firebaseApp = null;
let database = null;
let useFirebase = false;

const CONFIG_KEYS = [
  'firebase-use',
  'firebase-auth-domain',
  'firebase-db-url',
  'firebase-api-key',
];

const fetchConfig = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', CONFIG_KEYS);
  if (error || !data) {
    console.error('Error loading Firebase config:', error);
    return null;
  }
  const cfg = {};
  for (const row of data) {
    cfg[row.key] = row.value;
  }
  return cfg;
};

export const initFirebase = async () => {
  if (firebaseApp) return { firebaseApp, database };
  const cfg = await fetchConfig();
  if (!cfg || cfg['firebase-use'] !== 'true') return null;

  firebaseApp = initializeApp({
    apiKey: cfg['firebase-api-key'],
    authDomain: cfg['firebase-auth-domain'],
    databaseURL: cfg['firebase-db-url'],
  });
  database = getDatabase(firebaseApp);
  useFirebase = true;
  return { firebaseApp, database };
};

export const getDatabaseInstance = async () => {
  if (!firebaseApp && !useFirebase) {
    await initFirebase();
  }
  return useFirebase ? database : null;
};
