import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset URLs make the build work on GitHub Pages project URLs.
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssCodeSplit: true,
    target: 'es2022',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 650,
  },
  preview: {
    host: true,
  },
});
