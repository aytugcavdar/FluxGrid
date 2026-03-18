import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/', 
        'tests/', 
        '**/*.d.ts', 
        'src/app/index.tsx',
        'src/services/firebase/**',
        'functions/**'
      ],
      thresholds: {
        lines: 33,
        functions: 29,
        branches: 28,
      },
    },
  },
  resolve: {
    alias: {
      '@app':      path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared':   path.resolve(__dirname, './src/shared'),
      '@utils':    path.resolve(__dirname, './src/utils'),
    },
  },
});
