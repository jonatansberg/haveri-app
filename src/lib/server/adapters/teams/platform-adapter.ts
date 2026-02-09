import type { ChatAdapter } from '$lib/server/adapters/chat/contract';
import {
  addTeamsChannelMembers,
  archiveTeamsIncidentChannel,
  buildTeamsIncidentCard,
  createTeamsIncidentChannel,
  postTeamsGlobalIncidentCard,
  sendTeamsDirectMessage,
  updateTeamsGlobalIncidentCard
} from '$lib/server/adapters/teams/chat-ops';

function buildMessageCard(content: string): Record<string, unknown> {
  return {
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      {
        type: 'TextBlock',
        text: content,
        wrap: true
      }
    ]
  };
}

export const teamsChatAdapter: ChatAdapter = {
  async onMessage(): Promise<void> {
    return;
  },

  async onCommand(): Promise<void> {
    return;
  },

  async createChannel(name, _members, options): Promise<{ channelRef: string; channelName: string }> {
    return createTeamsIncidentChannel({
      incidentTitle: name,
      severity: options?.severity ?? 'SEV2'
    });
  },

  async archiveChannel(channelRef): Promise<void> {
    await archiveTeamsIncidentChannel({ channelRef });
  },

  async sendMessage(channelRef, content): Promise<void> {
    if (channelRef.startsWith('dm|')) {
      await sendTeamsDirectMessage({
        platformUserId: channelRef.slice('dm|'.length),
        content
      });
      return;
    }

    await postTeamsGlobalIncidentCard({
      channelRef,
      card: buildMessageCard(content)
    });
  },

  async sendCard(
    channelRef: string,
    card: Record<string, unknown>,
    messageRef?: string
  ): Promise<{ messageRef: string; channelRef: string }> {
    if (messageRef) {
      return updateTeamsGlobalIncidentCard({
        channelRef,
        messageRef,
        card
      });
    }

    return postTeamsGlobalIncidentCard({
      channelRef,
      card
    });
  },

  async addMembers(channelRef, members): Promise<void> {
    await addTeamsChannelMembers({
      channelRef,
      platformUserIds: members
    });
  },

  async resolveUser(): Promise<{ memberId: string; name: string } | null> {
    return null;
  },

  buildIncidentCard(input): Record<string, unknown> {
    return buildTeamsIncidentCard(input);
  }
};
