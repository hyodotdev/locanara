import { defineConfig } from 'vite';

export default defineConfig({
  root: 'example',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: '../dist-example',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@locanara/web': new URL('./src/index.ts', import.meta.url).pathname,
    },
  },
});
