import { expect, test } from '@playwright/test';

test.describe('Marketing site', () => {
  test('landing page captures email submissions', async ({ page }) => {
    const email = `landing-${Date.now().toString(36)}@example.com`;

    await page.goto('/landing');
    await expect(page.getByRole('heading', { name: 'Incident response for frontline operations' })).toBeVisible();

    await page.locator('input[name="email"]').fill(email);
    await page.getByRole('button', { name: 'Join waitlist' }).click();

    await expect(page.getByText('Thanks. You are on the list.')).toBeVisible();
  });

  test('contact page accepts valid submissions', async ({ page }) => {
    const email = `contact-${Date.now().toString(36)}@example.com`;

    await page.goto('/contact');
    await page.locator('input[name="name"]').fill('E2E Contact');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="company"]').fill('Haveri Labs');
    await page.locator('input[name="role"]').fill('Reliability Lead');
    await page.locator('input[name="teamSize"]').fill('25');
    await page
      .locator('textarea[name="message"]')
      .fill('We need faster incident routing and reliable follow-up tracking.');

    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Thanks. We received your message.')).toBeVisible();
  });

  test('about and blog pages render expected content', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: 'About Haveri' })).toBeVisible();

    await page.goto('/blog');
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Why we built Haveri/i })).toBeVisible();
  });
});
