import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Test files share one test database.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
