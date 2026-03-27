import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // For GitHub Pages, you must set base to "/<repo-name>/" (e.g. "/sme-360/").
  // For Netlify/normal hosting, keep base as "/".
  const env = loadEnv(mode, process.cwd(), '');
  // Important: GitHub Actions provides env vars via process.env, not .env files.
  // loadEnv() reads from .env.* files, so we also check process.env for CI/CD.
  // NOTE: This repo doesn't ship a tsconfig/@types/node, so the editor may not know `process`.
  // Accessing via globalThis keeps runtime behavior (Node has process.env) while avoiding TS 2580 errors.
  const base = (globalThis as any)?.process?.env?.VITE_BASE_PATH || env.VITE_BASE_PATH || '/';

  return {
    base,
    plugins: [react()],

    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
