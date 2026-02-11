import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockSvelteKitHandler = vi.hoisted(() => vi.fn());
const mockGetDefaultOrgId = vi.hoisted(() => vi.fn(() => 'org-default'));
const mockResolveOrganizationContextForUser = vi.hoisted(() => vi.fn());

vi.mock('$app/environment', () => ({
  building: false
}));

vi.mock('$lib/server/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession
    }
  }
}));

vi.mock('$lib/server/services/env', () => ({
  getDefaultOrgId: mockGetDefaultOrgId
}));

vi.mock('$lib/server/services/organization-context-service', () => ({
  resolveOrganizationContextForUser: mockResolveOrganizationContextForUser
}));

vi.mock('better-auth/svelte-kit', () => ({
  svelteKitHandler: mockSvelteKitHandler
}));

describe('hooks.server handle', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockSvelteKitHandler.mockReset();
    mockGetDefaultOrgId.mockClear();
    mockResolveOrganizationContextForUser.mockReset();
  });

  it('populates locals from session and delegates to Better Auth handler', async () => {
    mockGetSession.mockResolvedValue({
      session: { id: 'session-1', userId: 'user-1' },
      user: { id: 'user-1', email: 'user@example.com' }
    });
    mockResolveOrganizationContextForUser.mockResolvedValue({
      organizationId: 'org-custom',
      organizationSlug: 'acme'
    });

    const delegatedResponse = new Response('ok', { status: 200 });
    mockSvelteKitHandler.mockResolvedValue(delegatedResponse);

    const { handle } = await import('./hooks.server');

    const headers = new Headers({ 'x-org-id': 'org-custom' });
    const event = {
      request: new Request('http://localhost/api/incidents', { headers }),
      url: new URL('http://localhost/api/incidents'),
      locals: {}
    };
    const resolve = vi.fn();

    const response = await handle({ event, resolve } as unknown as Parameters<typeof handle>[0]);

    expect(response).toBe(delegatedResponse);
    expect(mockGetSession).toHaveBeenCalledWith({ headers });
    expect(event.locals).toEqual({
      session: { id: 'session-1', userId: 'user-1' },
      user: { id: 'user-1', email: 'user@example.com' },
      organizationId: 'org-custom',
      organizationSlug: 'acme'
    });
    expect(mockGetDefaultOrgId).toHaveBeenCalledTimes(1);
    expect(mockSvelteKitHandler).toHaveBeenCalledTimes(1);
    expect(mockSvelteKitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        event,
        resolve,
        building: false
      })
    );
  });

  it('sets user/session to null and falls back to default organization context', async () => {
    mockGetSession.mockResolvedValue(null);

    const delegatedResponse = new Response('unauthed', { status: 401 });
    mockSvelteKitHandler.mockResolvedValue(delegatedResponse);

    const { handle } = await import('./hooks.server');

    const event = {
      request: new Request('http://localhost/api/incidents'),
      url: new URL('http://localhost/api/incidents'),
      locals: {}
    };
    const resolve = vi.fn();

    const response = await handle({ event, resolve } as unknown as Parameters<typeof handle>[0]);

    expect(response).toBe(delegatedResponse);
    expect(event.locals).toEqual({
      session: null,
      user: null,
      organizationId: 'org-default',
      organizationSlug: 'default'
    });
    expect(mockGetDefaultOrgId).toHaveBeenCalledTimes(1);
    expect(mockSvelteKitHandler).toHaveBeenCalledTimes(1);
  });

  it('returns 403 when authenticated user is not mapped to a requested organization', async () => {
    mockGetSession.mockResolvedValue({
      session: { id: 'session-1', userId: 'user-1' },
      user: { id: 'user-1', email: 'user@example.com' }
    });
    mockResolveOrganizationContextForUser.mockResolvedValue(null);

    const { handle } = await import('./hooks.server');

    const event = {
      request: new Request('http://localhost/api/incidents', {
        headers: new Headers({ 'x-org-id': 'org-custom' })
      }),
      url: new URL('http://localhost/api/incidents'),
      locals: {}
    };
    const resolve = vi.fn();

    const response = await handle({ event, resolve } as unknown as Parameters<typeof handle>[0]);

    expect(response.status).toBe(403);
    await expect(response.text()).resolves.toBe('Forbidden');
    expect(mockSvelteKitHandler).not.toHaveBeenCalled();
  });

  it('rewrites slug-prefixed dashboard paths to internal routes', async () => {
    mockGetSession.mockResolvedValue({
      session: { id: 'session-2', userId: 'user-2' },
      user: { id: 'user-2', email: 'user2@example.com' }
    });
    mockResolveOrganizationContextForUser.mockResolvedValue({
      organizationId: 'org-2',
      organizationSlug: 'acme'
    });

    const delegatedResponse = new Response('ok', { status: 200 });
    mockSvelteKitHandler.mockResolvedValue(delegatedResponse);

    const { handle } = await import('./hooks.server');

    const event = {
      request: new Request('http://localhost/acme/incidents/123'),
      url: new URL('http://localhost/acme/incidents/123'),
      locals: {}
    };
    const resolve = vi.fn();

    const response = await handle({ event, resolve } as unknown as Parameters<typeof handle>[0]);

    expect(response).toBe(delegatedResponse);
    expect(event.url.pathname).toBe('/incidents/123');
    expect(mockResolveOrganizationContextForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-2',
        requestedOrganizationSlug: 'acme'
      })
    );
  });
});
