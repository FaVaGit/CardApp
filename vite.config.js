import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900, // alza limite per evitare warning non critici
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('fabric')) return 'fabric';
            if (id.includes('react')) return 'react';
            return 'vendor';
          }
        }
      }
    }
  }
});
