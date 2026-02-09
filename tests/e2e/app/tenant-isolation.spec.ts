import { expect, test } from '@playwright/test';
import { fixtureForProject, oppositeFixture } from '../helpers/tenants';

test.describe('Tenant isolation', () => {
  test('dashboard and incidents API are scoped to the active tenant', async ({ page }, testInfo) => {
    const own = fixtureForProject(testInfo.project.name);
    const other = oppositeFixture(testInfo.project.name);

    await page.goto('/');
    await expect(page.getByText('Open Incidents')).toBeVisible();
    await expect(page.getByText(own.incidentTitle)).toBeVisible();
    await expect(page.getByText(other.incidentTitle)).toHaveCount(0);

    const response = await page.request.get('/api/incidents');
    expect(response.ok()).toBe(true);

    const body = (await response.json()) as {
      incidents: { title: string }[];
    };

    const titles = body.incidents.map((incident) => incident.title);
    expect(titles).toContain(own.incidentTitle);
    expect(titles).not.toContain(other.incidentTitle);
  });

  test('follow-up list is scoped to tenant records', async ({ page }, testInfo) => {
    const own = fixtureForProject(testInfo.project.name);
    const other = oppositeFixture(testInfo.project.name);

    await page.goto('/followups');
    await expect(page.getByRole('main').getByText('Follow-ups', { exact: true })).toBeVisible();
    await expect(page.getByText(own.followUpDescription)).toBeVisible();
    await expect(page.getByText(other.followUpDescription)).toHaveCount(0);
  });
});
