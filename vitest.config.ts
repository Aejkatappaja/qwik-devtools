import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    environmentMatchGlobs: [
      ['src/components/**/*.spec.ts', 'jsdom'],
    ],
  },
});
