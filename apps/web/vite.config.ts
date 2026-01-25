import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { execSync } from 'child_process';

// Get git commit hash at build time
const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
};

// Plugin to inject build metadata into HTML
const htmlMetadataPlugin = (): Plugin => {
  const gitHash = getGitHash();
  const buildTime = new Date().toISOString();

  return {
    name: 'html-metadata',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `    <meta name="git-hash" content="${gitHash}" />
    <meta name="build-time" content="${buildTime}" />
  </head>`
      );
    },
  };
};

export default defineConfig({
  plugins: [react(), tailwindcss(), htmlMetadataPlugin()],
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
