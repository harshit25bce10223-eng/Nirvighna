import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-volunteer-to-index',
      closeBundle() {
        const outDir = resolve(__dirname, 'dist-volunteer');
        const src = resolve(outDir, 'volunteer.html');
        const dest = resolve(outDir, 'index.html');
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log('✓ Generated dist-volunteer/index.html for Capacitor');
        }
      }
    }
  ],
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
