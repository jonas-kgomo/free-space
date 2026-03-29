import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demos',
  build: {
    outDir: '../dist-demos',
    emptyOutDir: true
  }
});
