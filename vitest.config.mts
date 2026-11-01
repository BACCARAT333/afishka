import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts'],
      reporter: ['text', 'html'],
      // Требование практики: покрытие основной логики не ниже 70%
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
});
