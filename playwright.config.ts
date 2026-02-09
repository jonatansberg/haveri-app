import { defineConfig, devices } from '@playwright/test';
import { AUTH_STATE_PATH, tenantFixtures } from './tests/e2e/helpers/tenants';

const configuredBaseUrl = process.env['PLAYWRIGHT_BASE_URL'];
const baseURL =
  configuredBaseUrl && configuredBaseUrl.trim().length > 0
    ? configuredBaseUrl
    : 'http://127.0.0.1:4173';
const isCi = Boolean(process.env['CI']);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  ...(isCi ? { workers: 2 } : {}),
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: baseURL,
    reuseExistingServer: !isCi,
    timeout: 120_000
  },
  projects: [
    {
      name: 'setup',
      testMatch: /setup\/auth\.setup\.ts/
    },
    {
      name: 'tenant-a',
      dependencies: ['setup'],
      testMatch: /app\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE_PATH,
        extraHTTPHeaders: {
          'x-org-slug': tenantFixtures['tenant-a'].slug
        }
      }
    },
    {
      name: 'tenant-b',
      dependencies: ['setup'],
      testMatch: /app\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE_PATH,
        extraHTTPHeaders: {
          'x-org-slug': tenantFixtures['tenant-b'].slug
        }
      }
    },
    {
      name: 'public',
      testMatch: /public\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});
