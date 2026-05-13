import { defineConfig } from 'vite';

// VITE_DEPLOY_TARGET: 'pages' | 'capacitor' | undefined
// - 'pages'     -> base = '/<repo>/' (override via VITE_BASE)
// - 'capacitor' -> base = './' (relative paths required by capacitor:// scheme)
// - undefined   -> '/'
function resolveBase(): string {
  const target = process.env.VITE_DEPLOY_TARGET;
  if (target === 'capacitor') return './';
  if (target === 'pages') return process.env.VITE_BASE ?? '/game/';
  return '/';
}

export default defineConfig({
  base: resolveBase(),
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    assetsInlineLimit: 0, // never inline .wasm
    // Babylon + Havok pushes the bundle past Vite's default 500kB warning.
    chunkSizeWarningLimit: 8000,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
  },
});
