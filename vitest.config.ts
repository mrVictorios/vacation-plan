import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
      include: [
        'src/lib/**/*.ts'
      ],
      exclude: [
        'src/**/*.svelte',
        'src/main.ts',
        'src/app.css',
        'vite.config.ts',
        'svelte.config.js',
        'tailwind.config.cjs',
        'postcss.config.cjs'
      ],
    },
  },
});
