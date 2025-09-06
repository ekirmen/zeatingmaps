import { initializeApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

let functionsApp;
let functionsInstance;

const getFunctionsConfig = () => {
    return {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    };
};

export const getFunctionsInstance = () => {
    if (functionsInstance) return functionsInstance;

    const config = getFunctionsConfig();

    if (!functionsApp) {
        functionsApp = initializeApp(config);
    }

    functionsInstance = getFunctions(functionsApp);

    if (process.env.REACT_APP_USE_FUNCTIONS_EMULATOR === 'true') {
        const host = process.env.REACT_APP_FUNCTIONS_EMULATOR_HOST || '127.0.0.1';
        const port = process.env.REACT_APP_FUNCTIONS_EMULATOR_PORT || '5000';
        connectFunctionsEmulator(functionsInstance, host, parseInt(port, 10));
        console.log(`[functionsClient] Connected to Functions emulator at ${host}:${port}`);
    }

    return functionsInstance;
};
