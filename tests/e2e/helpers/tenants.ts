export interface TenantFixture {
  key: 'tenant-a' | 'tenant-b';
  organizationId: string;
  slug: string;
  name: string;
  facilityId: string;
  facilityName: string;
  areaId: string;
  areaName: string;
  assetId: string;
  assetName: string;
  memberLeadId: string;
  memberLeadName: string;
  memberCommsId: string;
  memberCommsName: string;
  incidentId: string;
  incidentTitle: string;
  followUpDescription: string;
}

export const AUTH_STATE_PATH = 'playwright/.auth/user.json';

export const tenantFixtures: Record<'tenant-a' | 'tenant-b', TenantFixture> = {
  'tenant-a': {
    key: 'tenant-a',
    organizationId: '10000000-0000-4000-8000-000000000001',
    slug: 'e2e-tenant-a',
    name: 'E2E Tenant A',
    facilityId: '11000000-0000-4000-8000-000000000001',
    facilityName: 'E2E Plant A',
    areaId: '12000000-0000-4000-8000-000000000001',
    areaName: 'E2E Area A',
    assetId: '13000000-0000-4000-8000-000000000001',
    assetName: 'E2E Asset A',
    memberLeadId: '14000000-0000-4000-8000-000000000001',
    memberLeadName: 'Taylor Tenant A',
    memberCommsId: '15000000-0000-4000-8000-000000000001',
    memberCommsName: 'Jordan Tenant A',
    incidentId: '16000000-0000-4000-8000-000000000001',
    incidentTitle: 'E2E Tenant A Seed Incident',
    followUpDescription: 'E2E Tenant A Follow-up'
  },
  'tenant-b': {
    key: 'tenant-b',
    organizationId: '20000000-0000-4000-8000-000000000002',
    slug: 'e2e-tenant-b',
    name: 'E2E Tenant B',
    facilityId: '21000000-0000-4000-8000-000000000002',
    facilityName: 'E2E Plant B',
    areaId: '22000000-0000-4000-8000-000000000002',
    areaName: 'E2E Area B',
    assetId: '23000000-0000-4000-8000-000000000002',
    assetName: 'E2E Asset B',
    memberLeadId: '24000000-0000-4000-8000-000000000002',
    memberLeadName: 'Taylor Tenant B',
    memberCommsId: '25000000-0000-4000-8000-000000000002',
    memberCommsName: 'Jordan Tenant B',
    incidentId: '26000000-0000-4000-8000-000000000002',
    incidentTitle: 'E2E Tenant B Seed Incident',
    followUpDescription: 'E2E Tenant B Follow-up'
  }
};

export function fixtureForProject(projectName: string): TenantFixture {
  if (projectName !== 'tenant-a' && projectName !== 'tenant-b') {
    throw new Error(`Unsupported tenant project: ${projectName}`);
  }

  return tenantFixtures[projectName];
}

export function oppositeFixture(projectName: string): TenantFixture {
  const current = fixtureForProject(projectName);
  return current.key === 'tenant-a' ? tenantFixtures['tenant-b'] : tenantFixtures['tenant-a'];
}

export function allTenantFixtures(): TenantFixture[] {
  return [tenantFixtures['tenant-a'], tenantFixtures['tenant-b']];
}
