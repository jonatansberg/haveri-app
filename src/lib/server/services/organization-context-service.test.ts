import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDbSelect = vi.hoisted(() => vi.fn());
const mockWithTransaction = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db/client', () => ({
  db: {
    select: mockDbSelect
  },
  withTransaction: mockWithTransaction
}));

import { resolveOrganizationContextForUser } from './organization-context-service';

function selectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn()
  };

  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockResolvedValue(rows);

  return chain;
}

describe('resolveOrganizationContextForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selects the requested organization when user is a member', async () => {
    mockDbSelect.mockReturnValueOnce(
      selectChain([
        { organizationId: 'org-1', organizationSlug: 'acme' },
        { organizationId: 'org-2', organizationSlug: 'north-plant' }
      ])
    );

    const result = await resolveOrganizationContextForUser({
      userId: 'user-1',
      fallbackOrganizationId: 'org-1',
      requestedOrganizationId: 'org-2'
    });

    expect(result).toEqual({
      organizationId: 'org-2',
      organizationSlug: 'north-plant'
    });
  });

  it('provisions fallback membership when user has no memberships yet', async () => {
    mockDbSelect
      .mockReturnValueOnce(selectChain([]))
      .mockReturnValueOnce(selectChain([{ organizationId: 'org-1', organizationSlug: 'acme' }]));

    const txInsert = vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined)
      }))
    }));

    mockWithTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        insert: txInsert
      })
    );

    const result = await resolveOrganizationContextForUser({
      userId: 'user-1',
      fallbackOrganizationId: 'org-1'
    });

    expect(result).toEqual({
      organizationId: 'org-1',
      organizationSlug: 'acme'
    });
    expect(mockWithTransaction).toHaveBeenCalledTimes(1);
  });
});
