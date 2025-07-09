import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { supabase } from '../supabaseClient'; // Asegúrate de que la ruta a tu cliente Supabase sea correcta

let firebaseApp;
let database;
let authInstance; // Variable para la instancia de autenticación

const CONFIG_KEYS = [
    'firebase-use',
    'firebase-api-key',
    'firebase-auth-domain',
    'firebase-db-url',
    // Puedes añadir más si necesitas, por ejemplo, projectId, storageBucket, messagingSenderId, appId
    // 'firebase-project-id',
    // 'firebase-storage-bucket',
    // 'firebase-messaging-sender-id',
    // 'firebase-app-id',
];

/**
 * Obtiene la configuración de Firebase, priorizando las variables de entorno.
 * Si no están presentes en el entorno, intenta obtenerlas de Supabase.
 * @returns {Promise<object>} Objeto de configuración de Firebase.
 */
const getConfig = async () => {
    // Primero, intenta cargar la configuración desde las variables de entorno
    const envConfig = {
        useFirebase: process.env.REACT_APP_USE_FIREBASE === 'true',
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
        // Añade aquí cualquier otra variable de entorno que uses para Firebase
        // projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        // storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        // messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        // appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };

    // Si las variables de entorno indican que Firebase debe usarse y tienen lo mínimo, úsalas.
    if (envConfig.useFirebase && envConfig.apiKey && envConfig.authDomain && envConfig.databaseURL) {
        console.log('[firebaseClient] Usando configuración de Firebase desde variables de entorno.');
        return envConfig;
    }

    // Si no, intenta cargar desde Supabase settings
    const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', CONFIG_KEYS);

    if (error) {
        console.error('[firebaseClient] Error al cargar configuración desde Supabase:', error);
        // Retorna la configuración de entorno (que podría ser incompleta)
        // si hay un error al cargar de Supabase para evitar fallos completos.
        return envConfig;
    }

    const map = Object.fromEntries(data.map((r) => [r.key, r.value]));

    const supabaseConfig = {
        useFirebase: map['firebase-use'] === 'true',
        // Combina con las variables de entorno por si alguna clave falta en Supabase
        apiKey: map['firebase-api-key'] || envConfig.apiKey,
        authDomain: map['firebase-auth-domain'] || envConfig.authDomain,
        databaseURL: map['firebase-db-url'] || envConfig.databaseURL,
        // Aquí también para las otras claves si las usas
        // projectId: map['firebase-project-id'] || envConfig.projectId,
        // storageBucket: map['firebase-storage-bucket'] || envConfig.storageBucket,
        // messagingSenderId: map['firebase-messaging-sender-id'] || envConfig.messagingSenderId,
        // appId: map['firebase-app-id'] || envConfig.appId,
    };
    console.log('[firebaseClient] Usando configuración de Firebase desde ajustes de Supabase:', supabaseConfig);
    return supabaseConfig;
};

/**
 * Obtiene la instancia de la base de datos de Firebase (Realtime Database).
 * Inicializa la aplicación de Firebase y las instancias de DB y Auth si aún no lo están.
 * @returns {Promise<firebase.database.Database|null>} La instancia de Realtime Database o null si no se inicializa.
 */
export const getDatabaseInstance = async () => {
    if (database) return database; // Si ya está inicializada, la devuelve.

    const cfg = await getConfig(); // Carga la configuración.

    // Verifica si Firebase está habilitado y tiene la configuración mínima.
    if (!cfg.useFirebase || !cfg.apiKey || !cfg.authDomain || !cfg.databaseURL) {
        console.warn('[firebaseClient] Configuración de Firebase incompleta o deshabilitada. Firebase no se inicializará.');
        return null;
    }

    // Inicializa la aplicación de Firebase si no lo está.
    // Solo se debe llamar a initializeApp una vez.
    if (!firebaseApp) {
        firebaseApp = initializeApp({
            apiKey: cfg.apiKey,
            authDomain: cfg.authDomain,
            databaseURL: cfg.databaseURL,
            // Asegúrate de añadir aquí el resto de tus claves de configuración si las usas.
            // projectId: cfg.projectId,
            // storageBucket: cfg.storageBucket,
            // messagingSenderId: cfg.messagingSenderId,
            // appId: cfg.appId,
        });
        database = getDatabase(firebaseApp);
        authInstance = getAuth(firebaseApp); // Inicializa y asigna la instancia de autenticación
    }

    return database;
};

/**
 * Obtiene la instancia del servicio de autenticación de Firebase.
 * Asegura que Firebase se haya inicializado al intentar obtener la instancia de la base de datos primero.
 * @returns {Promise<firebase.auth.Auth|null>} La instancia de Auth o null si no se inicializa.
 */
export const getAuthInstance = async () => {
    // Aseguramos que Firebase se haya inicializado al obtener la instancia de la base de datos.
    // Esto es crucial para que 'authInstance' esté disponible.
    await getDatabaseInstance();
    return authInstance;
};

/**
 * Función para inicializar Firebase (aunque getDatabaseInstance ya lo hace si es necesario).
 * Útil si quieres una llamada explícita de "setup".
 * @returns {Promise<{firebaseApp: firebase.app.App, database: firebase.database.Database, auth: firebase.auth.Auth}|null>}
 */
export const initFirebase = async () => {
    const db = await getDatabaseInstance();
    const auth = await getAuthInstance();
    if (firebaseApp && db && auth) {
        return { firebaseApp, database: db, auth };
    }
    return null;
};

let enabledCache;

/**
 * Verifica si Firebase está configurado y habilitado para usar.
 * @returns {Promise<boolean>} True si Firebase está habilitado, false en caso contrario.
 */
export const isFirebaseEnabled = async () => {
    if (enabledCache !== undefined) return enabledCache; // Devuelve el valor cacheado si existe.
    const cfg = await getConfig();
    enabledCache =
        cfg.useFirebase && cfg.apiKey && cfg.authDomain && cfg.databaseURL;
    return enabledCache;
};

// --- Exportaciones finales para usar en otros módulos ---
// Estas promesas se resolverán con las instancias de DB y Auth una vez que estén disponibles.
// Esto permite una importación limpia y asíncrona en otros módulos.
export const db = (async () => await getDatabaseInstance())();
export const auth = (async () => await getAuthInstance())();

