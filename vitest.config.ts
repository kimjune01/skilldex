import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'apps/api/src/**/*.test.ts',
      'packages/*/src/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**', 'dist', '.sst', 'apps/web/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        'dist',
        '.sst',
        '**/*.config.*',
        '**/fixtures.ts',
      ],
    },
  },
})
