import { defineConfig } from 'vite';

// Фронтенд лежит в web/, запросы /api в режиме разработки уходят на сервер Express (порт 3000).
export default defineConfig({
  root: 'web',
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
