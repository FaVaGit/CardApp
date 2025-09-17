import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  include: ['src/**/*.spec.{js,jsx}', 'tests/unit/**/*.spec.{js,jsx}', 'tests/integration/**/*.test.{js,jsx}'],
    coverage: {
      reporter: ['text','lcov'],
    }
  }
});
