import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/store',
    // Expose env vars with these prefixes to the client
    envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'REACT_APP_'],
    build: {
        outDir: 'build',
        sourcemap: false,
        // Increase chunk size warning limit to 1000 KB
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                // Manual chunk splitting for better code splitting
                manualChunks: {
                    // Vendor chunks
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'antd-vendor': ['antd', '@ant-design/icons'],
                    'supabase-vendor': ['@supabase/supabase-js'],
                    'map-vendor': ['konva', 'react-konva'],
                    'editor-vendor': ['react-quill', 'quill'],

                    // App chunks
                    'backoffice-core': [
                        './src/backoffice/BackofficeLayoutWithRoles.jsx',
                        './src/backoffice/BackofficeAppWithRoles.jsx'
                    ],
                    'store-core': [
                        './src/store/StoreApp.jsx',
                        './src/store/components/StoreHeader.jsx'
                    ]
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    server: {
        port: 3000,
        open: true
    }
});
