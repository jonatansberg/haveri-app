import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib')
    }
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/lib/server/adapters/teams/*.ts',
        'src/lib/server/domain/state-machine.ts',
        'src/lib/server/services/incident-workflow-service.ts',
        'src/routes/api/incidents/**/+server.ts'
      ],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 85,
        lines: 80
      }
    }
  }
});
