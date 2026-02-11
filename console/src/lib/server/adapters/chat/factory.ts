import type { ChatAdapter } from '$lib/server/adapters/chat/contract';
import { teamsChatAdapter } from '$lib/server/adapters/teams/platform-adapter';
import { ValidationError } from '$lib/server/services/errors';

export function getChatAdapter(platform: string): ChatAdapter {
  if (platform === 'teams') {
    return teamsChatAdapter;
  }

  throw new ValidationError(`Unsupported chat platform adapter: ${platform}`);
}
