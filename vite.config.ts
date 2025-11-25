import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        // *** CRITICAL FIX ADDED HERE ***
        // This tells Vercel/Vite to use relative paths for assets, 
        // ensuring the built JS files are found.
        base: './', 
        // *******************************
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        define: {
            // These environment variables are correctly defined but must be set in Vercel UI.
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});
