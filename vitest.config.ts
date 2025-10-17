import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
    reporters: 'basic',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
    },
  },
});


