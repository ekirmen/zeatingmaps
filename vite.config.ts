import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig(({ mode }) => {
    // Cargar variables de entorno
    const env = loadEnv(mode, process.cwd(), '');

    // Filtrar variables seguras para evitar exponer secretos del servidor
    const processEnv: Record<string, string> = {};
    Object.keys(env).forEach(key => {
        if (key.startsWith('REACT_APP_') || key.startsWith('VITE_') || key.includes('URL') || key.includes('ANON_KEY')) {
            processEnv[key] = env[key];
        }
    });

    return {
        plugins: [react(), svgr()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
        },
        define: {
            'process.env': JSON.stringify(processEnv),
        },
        server: {
            port: 3000,
        },
        build: {
            commonjsOptions: {
                transformMixedEsModules: true,
            },
            outDir: 'build', // Mantener compatibilidad con carpeta de salida
        },
        esbuild: {
            loader: "jsx",
            include: /src\/.*\.jsx?$/,
            exclude: [],
        },
    };
});
