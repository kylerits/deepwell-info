import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'worker/**/*.test.ts', 'scripts/**/*.test.mjs', 'tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
