import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { addMembershipsForUserEmail, seedE2eTenants } from '../helpers/db';
import { AUTH_STATE_PATH } from '../helpers/tenants';

test.describe.configure({ mode: 'serial' });

test('seed tenants and capture shared auth state', async ({ page }) => {
  const runId = Date.now().toString(36);
  await seedE2eTenants({ runId });

  const email = `e2e-${runId}@haveri.test`;
  const password = 'E2E-password-123!';
  const registrationResponse = await page.context().request.post('/api/auth/sign-up/email', {
    data: {
      name: 'E2E User',
      email,
      password,
      callbackURL: '/'
    }
  });

  expect(registrationResponse.ok()).toBe(true);
  await page.goto('/');
  await expect(page).not.toHaveURL(/\/login$/);
  await addMembershipsForUserEmail(email);

  const authStatePath = path.resolve(process.cwd(), AUTH_STATE_PATH);
  fs.mkdirSync(path.dirname(authStatePath), { recursive: true });
  await page.context().storageState({ path: authStatePath });
});
