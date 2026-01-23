import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        // NOTE: Do NOT add a proxy for /api here.
        // API calls should use VITE_API_URL env variable directly (e.g., API_BASE from lib/api.ts).
        // This keeps dev/prod consistent and avoids proxy configuration issues.
    },
});
