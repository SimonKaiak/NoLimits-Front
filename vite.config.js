/**
 * vite.config.js
 * Configuración de Vite 5 para no/limits.
 *
 * IGDB proxy:
 *   En desarrollo, /api/igdb/* → https://api.igdb.com/v4/*
 *   Vite inyecta Client-ID y Authorization en el servidor antes de reenviar.
 *   Así el browser nunca ve los headers de auth ni tiene problemas de CORS.
 *
 *   En producción (build), el proxy no existe → el backend debe exponer
 *   /api/igdb/* como endpoint propio con las mismas credenciales.
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/tests/setup.js',

      // Evita que un .env local (p. ej. VITE_API_BASE_URL=http://localhost:8080
      // para apuntar a un backend propio en desarrollo) se filtre a los tests
      // y rompa las aserciones que esperan rutas relativas (/api/igdb/...).
      env: {
        VITE_API_BASE_URL: '',
      },

      exclude: [
        'node_modules',
        'dist',
        'coverage',
        'playwright-report',
        'test-results',
        'src/tests/e2e/**',
        'src/tests/smoke/*.playwright.test.js',
      ],
    },

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },

    server: {
      proxy: {
        '/api/igdb': {
          target: 'https://api.igdb.com/v4',
          changeOrigin: true,

          rewrite: (path) => path.replace(/^\/api\/igdb/, ''),

          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Client-ID', env.VITE_IGDB_CLIENT_ID ?? '');
              proxyReq.setHeader('Authorization', `Bearer ${env.VITE_IGDB_TOKEN ?? ''}`);
              proxyReq.setHeader('Content-Type', 'text/plain');
            });
          },
        },
      },
    },
  };
});