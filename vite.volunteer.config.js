import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3001
  },
  build: {
    outDir: 'dist-volunteer',
    chunkSizeWarningLimit: 1600,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'volunteer.html')
      }
    }
  }
});
