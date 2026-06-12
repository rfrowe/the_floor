import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readdirSync } from 'node:fs';
import path from 'path';

/**
 * List sample-category filenames in public/categories at build time.
 * Injected as `__SAMPLE_CATEGORY_FILES__` so the app can enumerate them without
 * `import.meta.glob`, which would bundle each ~10 MB JSON into a dead chunk.
 */
function listSampleCategoryFiles(): string[] {
  try {
    return readdirSync(path.resolve(__dirname, 'public/categories'))
      .filter((file) => file.toLowerCase().endsWith('.json'))
      .sort();
  } catch {
    return [];
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  define: {
    __SAMPLE_CATEGORY_FILES__: JSON.stringify(listSampleCategoryFiles()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // registered manually in src/main.tsx
      devOptions: { enabled: false }, // keep the SW out of `vite dev` (avoids HMR cache traps)
      workbox: {
        // Precache the app shell. The 202 MB of sample categories are intentionally
        // excluded so a first visit doesn't download them — they are cached on demand
        // by the offline-download button via the runtime route below.
        globPatterns: ['**/*.{js,css,html,ico,svg,png,webmanifest}'],
        globIgnores: ['**/categories/**'],
        navigateFallback: 'index.html', // enables cold offline navigation (no tab open)
        navigateFallbackDenylist: [/^\/categories\//, /\.json$/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // Raise from the 2 MiB default so the single (un-split) app bundle is precached;
        // otherwise Workbox silently drops it and cold offline load breaks.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // Sample categories: served from the app-owned cache filled by downloadAll().
            // cacheName MUST match CATEGORY_CACHE in src/services/offlineCache.ts.
            urlPattern: ({ url }) =>
              url.pathname.includes('/categories/') && url.pathname.endsWith('.json'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'floor-categories-v1',
              cacheableResponse: { statuses: [0, 200] },
              // No expiration: the set is fixed and managed explicitly via clearOffline().
            },
          },
        ],
      },
      manifest: {
        name: 'The Floor',
        short_name: 'The Floor',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [{ src: 'vite.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@models': path.resolve(__dirname, './src/models'),
      '@services': path.resolve(__dirname, './src/services'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@storage': path.resolve(__dirname, './src/storage'),
    },
  },
  // @ts-expect-error - Vitest config added via plugin
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js}',
        'dist/',
      ],
    },
  },
});
