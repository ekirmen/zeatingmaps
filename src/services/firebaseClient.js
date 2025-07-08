import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth'; // Importamos getAuth
import { supabase } from '../supabaseClient';

let firebaseApp;
let database;
let authInstance; // Variable para la instancia de autenticación

const CONFIG_KEYS = [
    'firebase-use',
    'firebase-api-key',
    'firebase-auth-domain',
    'firebase-db-url',
];

const getConfig = async () => {
    const env = {
        useFirebase: process.env.REACT_APP_USE_FIREBASE === 'true',
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
    };

    if (env.useFirebase && env.apiKey && env.authDomain && env.databaseURL) {
        return env;
    }

    const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', CONFIG_KEYS);

    if (error) {
        console.error('[firebaseClient] Settings load error', error);
        return env;
    }

    const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
    return {
        useFirebase: map['firebase-use'] === 'true',
        apiKey: map['firebase-api-key'] || env.apiKey,
        authDomain: map['firebase-auth-domain'] || env.authDomain,
        databaseURL: map['firebase-db-url'] || env.databaseURL,
    };
};

export const getDatabaseInstance = async () => {
    if (database) return database;

    const cfg = await getConfig();
    if (!cfg.useFirebase) return null;
    if (!cfg.apiKey || !cfg.authDomain || !cfg.databaseURL) {
        console.warn('[firebaseClient] Missing Firebase configuration. Firebase will not be initialized.');
        return null;
    }

    if (!firebaseApp) {
        firebaseApp = initializeApp({
            apiKey: cfg.apiKey,
            authDomain: cfg.authDomain,
            databaseURL: cfg.databaseURL,
        });
        database = getDatabase(firebaseApp);
        authInstance = getAuth(firebaseApp); // Inicializa y asigna la instancia de autenticación
    }

    return database;
};

// Exporta la instancia de autenticación directamente
export const getAuthInstance = async () => {
    // Aseguramos que Firebase se haya inicializado al obtener la instancia de la base de datos
    await getDatabaseInstance();
    return authInstance;
};

export const initFirebase = async () => {
    await getDatabaseInstance();
    await getAuthInstance(); // Asegura que la instancia de auth esté disponible
    return { firebaseApp, database, auth: authInstance };
};

let enabledCache;

export const isFirebaseEnabled = async () => {
    if (enabledCache !== undefined) return enabledCache;
    const cfg = await getConfig();
    enabledCache =
        cfg.useFirebase && cfg.apiKey && cfg.authDomain && cfg.databaseURL;
    return enabledCache;
};

// --- Exportaciones finales para usar en otros módulos ---
// Usamos IIFE (Immediately Invoked Function Expression) para manejar el await en el top-level
// Esto permite que 'db' y 'auth' sean las instancias resueltas directamente al importarlas.
export const db = (async () => await getDatabaseInstance())();
export const auth = (async () => await getAuthInstance())();