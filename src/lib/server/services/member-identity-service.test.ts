import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDbSelect = vi.hoisted(() => vi.fn());
const mockWithTransaction = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db/client', () => ({
  db: {
    select: mockDbSelect
  },
  withTransaction: mockWithTransaction
}));

import { resolveOrProvisionMemberByPlatformIdentity } from './member-identity-service';

function selectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
    limit: vi.fn()
  };

  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.limit.mockResolvedValue(rows);

  return chain;
}

describe('member identity provisioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns existing member mapping when identity already exists', async () => {
    mockDbSelect.mockReturnValueOnce(selectChain([{ memberId: 'member-1', name: 'Alex' }]));

    const result = await resolveOrProvisionMemberByPlatformIdentity({
      organizationId: 'org-1',
      platform: 'teams',
      platformUserId: 'aad-user-1',
      platformTenantId: 'tenant-1',
      displayName: 'Alex'
    });

    expect(result).toEqual({
      memberId: 'member-1',
      name: 'Alex',
      wasProvisioned: false
    });
    expect(mockWithTransaction).not.toHaveBeenCalled();
  });

  it('auto-provisions a member when identity does not exist', async () => {
    mockDbSelect.mockReturnValueOnce(selectChain([]));

    const txSelect = vi.fn().mockReturnValue(selectChain([]));
    const txInsert = vi
      .fn()
      .mockImplementationOnce(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 'member-new', name: 'Taylor' }])
        }))
      }))
      .mockImplementationOnce(() => ({
        values: vi.fn(() => ({
          onConflictDoNothing: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ id: 'identity-new' }])
          }))
        }))
      }));

    mockWithTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        select: txSelect,
        insert: txInsert
      })
    );

    const result = await resolveOrProvisionMemberByPlatformIdentity({
      organizationId: 'org-1',
      platform: 'teams',
      platformUserId: 'aad-user-2',
      platformTenantId: 'tenant-2',
      displayName: 'Taylor'
    });

    expect(result).toEqual({
      memberId: 'member-new',
      name: 'Taylor',
      wasProvisioned: true
    });
    expect(mockWithTransaction).toHaveBeenCalledTimes(1);
  });

  it('does not auto-provision when display name is unavailable', async () => {
    mockDbSelect.mockReturnValueOnce(selectChain([]));

    const result = await resolveOrProvisionMemberByPlatformIdentity({
      organizationId: 'org-1',
      platform: 'teams',
      platformUserId: 'aad-user-3',
      platformTenantId: 'tenant-3',
      displayName: '   '
    });

    expect(result).toBeNull();
    expect(mockWithTransaction).not.toHaveBeenCalled();
  });
});
