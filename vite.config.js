import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    chunkSizeWarningLimit: 1600,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor splits
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-qr': ['qrcode'],
          // Heavy pages
          'page-booking': ['./src/pages/Booking.jsx'],
          'page-travel': ['./src/pages/Travel.jsx'],
          'page-home': ['./src/pages/Home.jsx'],
          'page-mybookings': ['./src/pages/MyBookings.jsx'],
          'page-profile': ['./src/pages/Profile.jsx'],
          // Heavy components
          'comp-audionav': ['./src/components/PriorityAudioNav.jsx'],
        }
      }
    }
  }
});

