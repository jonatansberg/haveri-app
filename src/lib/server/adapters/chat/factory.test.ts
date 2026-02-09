import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '$lib/server/services/errors';

vi.mock('$lib/server/adapters/teams/platform-adapter', () => ({
  teamsChatAdapter: {
    onMessage: vi.fn(),
    onCommand: vi.fn(),
    createChannel: vi.fn(),
    archiveChannel: vi.fn(),
    sendMessage: vi.fn(),
    sendCard: vi.fn(),
    addMembers: vi.fn(),
    resolveUser: vi.fn()
  }
}));

import { getChatAdapter } from './factory';

describe('chat adapter factory', () => {
  it('returns teams adapter for teams platform', () => {
    const adapter = getChatAdapter('teams');
    expect(typeof adapter.createChannel).toBe('function');
    expect(typeof adapter.sendCard).toBe('function');
  });

  it('throws for unsupported platforms', () => {
    expect(() => getChatAdapter('slack')).toThrow(ValidationError);
  });
});
