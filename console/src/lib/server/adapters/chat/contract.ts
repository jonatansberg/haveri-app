export interface ChatUserRef {
  id: string;
  displayName?: string;
}

export interface ChatAttachmentRef {
  name: string | null;
  contentType: string | null;
  contentUrl: string | null;
}

export interface ChatChannelRef {
  channelRef: string;
  channelName?: string;
}

export interface ChatCardDelivery {
  messageRef: string;
  channelRef: string;
}

export interface ChatAdapter {
  onMessage(
    channel: string,
    user: ChatUserRef,
    text: string,
    attachments?: ChatAttachmentRef[]
  ): Promise<void>;
  onCommand(command: string, args: string[], user: ChatUserRef, channel: string): Promise<void>;
  createChannel(
    name: string,
    members: string[],
    options?: { severity?: string }
  ): Promise<ChatChannelRef>;
  archiveChannel(channelRef: string): Promise<void>;
  sendMessage(channelRef: string, content: string): Promise<void>;
  sendCard(channelRef: string, card: Record<string, unknown>, messageRef?: string): Promise<ChatCardDelivery>;
  addMembers(channelRef: string, members: string[]): Promise<void>;
  resolveUser(
    platformUserId: string,
    platformTenantId?: string | null
  ): Promise<{ memberId: string; name: string } | null>;
  buildIncidentCard?(input: {
    incidentId: string;
    title: string;
    severity: string;
    status: string;
    facilityName: string;
    channelRef: string;
    responsibleLead: string | null;
    commsLead: string | null;
    tags: string[];
  }): Record<string, unknown>;
}
