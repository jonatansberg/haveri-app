import { AdaptiveCard, Fact, FactSet, TextBlock } from '@microsoft/teams.cards';
import * as graphEndpoints from '@microsoft/teams.graph-endpoints';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { organizationChatSettings } from '$lib/server/db/schema';
import {
  getTeamsDirectMessageSenderUserId,
  getTeamsGlobalIncidentChannel,
  getTeamsGraphBaseUrlRoot,
  getTeamsIncidentChannelPrefix,
  getTeamsIncidentTeamId
} from '$lib/server/services/env';
import { ValidationError } from '$lib/server/services/errors';
import {
  createTeamsGraphClient,
  getTeamsGraphAccessToken,
  isTeamsGraphConfigured
} from './graph-client';

const ADAPTIVE_CARD_CONTENT_TYPE = 'application/vnd.microsoft.card.adaptive';
const ADAPTIVE_CARD_ATTACHMENT_ID = 'haveriIncidentCard';

interface TeamsChannelLocator {
  teamId: string;
  channelId: string;
  channelRef: string;
}

interface TeamsMessageLocator extends TeamsChannelLocator {
  messageId: string;
  messageRef: string;
}

interface GraphChatMessageBody {
  '@odata.type': string;
  contentType: 'html';
  content: string;
}

interface GraphChatMessageAttachment {
  '@odata.type': string;
  id: string;
  contentType: string;
  content: string;
}

export interface TeamsChatSettings {
  globalIncidentChannelRef: string;
  autoCreateIncidentChannel: boolean;
  autoArchiveOnClose: boolean;
}

export interface TeamsIncidentCardInput {
  incidentId: string;
  title: string;
  severity: string;
  status: string;
  facilityName: string;
  channelRef: string;
  responsibleLead: string | null;
  commsLead: string | null;
  tags: string[];
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 36);
}

function buildChannelRef(teamId: string, channelId: string): string {
  return `teams|${teamId}|${channelId}`;
}

function buildMessageRef(teamId: string, channelId: string, messageId: string): string {
  return `${buildChannelRef(teamId, channelId)}|message|${encodeURIComponent(messageId)}`;
}

function parseChannelRef(rawRef: string): TeamsChannelLocator {
  const canonical = /^teams\|([^|]+)\|([^|]+)$/.exec(rawRef);
  if (canonical?.[1] && canonical[2]) {
    return {
      teamId: canonical[1],
      channelId: canonical[2],
      channelRef: rawRef
    };
  }

  const legacyTeamChannel = /^teams:([^:]+):(.+)$/.exec(rawRef);
  if (
    legacyTeamChannel?.[1] &&
    legacyTeamChannel[2] &&
    legacyTeamChannel[1] !== 'channel' &&
    legacyTeamChannel[1] !== 'message' &&
    legacyTeamChannel[1] !== 'global'
  ) {
    const teamId = legacyTeamChannel[1];
    const channelId = legacyTeamChannel[2];
    return {
      teamId,
      channelId,
      channelRef: buildChannelRef(teamId, channelId)
    };
  }

  const legacyGeneratedChannel = /^teams:channel:(.+)$/.exec(rawRef);
  if (legacyGeneratedChannel?.[1]) {
    const teamId = getTeamsIncidentTeamId();
    if (!teamId) {
      throw new ValidationError(
        'Missing TEAMS_INCIDENT_TEAM_ID to resolve a Teams channel reference'
      );
    }

    return {
      teamId,
      channelId: legacyGeneratedChannel[1],
      channelRef: buildChannelRef(teamId, legacyGeneratedChannel[1])
    };
  }

  const legacyGlobalChannel = /^teams:global:(.+)$/.exec(rawRef);
  if (legacyGlobalChannel?.[1]) {
    const teamId = getTeamsIncidentTeamId();
    if (!teamId) {
      throw new ValidationError(
        'Missing TEAMS_INCIDENT_TEAM_ID to resolve TEAMS_GLOBAL_INCIDENT_CHANNEL'
      );
    }

    return {
      teamId,
      channelId: legacyGlobalChannel[1],
      channelRef: buildChannelRef(teamId, legacyGlobalChannel[1])
    };
  }

  const slashRef = /^([^/]+)\/(.+)$/.exec(rawRef);
  if (slashRef?.[1] && slashRef[2]) {
    return {
      teamId: slashRef[1],
      channelId: slashRef[2],
      channelRef: buildChannelRef(slashRef[1], slashRef[2])
    };
  }

  const fallbackTeamId = getTeamsIncidentTeamId();
  if (!fallbackTeamId) {
    throw new ValidationError(
      'Unable to resolve Teams channel reference. Set TEAMS_INCIDENT_TEAM_ID or use <teamId>/<channelId> format.'
    );
  }

  return {
    teamId: fallbackTeamId,
    channelId: rawRef,
    channelRef: buildChannelRef(fallbackTeamId, rawRef)
  };
}

function parseMessageRef(messageRef: string, channelRef: string): TeamsMessageLocator {
  const canonical = /^teams\|([^|]+)\|([^|]+)\|message\|(.+)$/.exec(messageRef);
  if (canonical?.[1] && canonical[2] && canonical[3]) {
    return {
      teamId: canonical[1],
      channelId: canonical[2],
      messageId: decodeURIComponent(canonical[3]),
      channelRef: buildChannelRef(canonical[1], canonical[2]),
      messageRef
    };
  }

  const legacyMessage = /^teams:message:(.+)$/.exec(messageRef);
  if (legacyMessage?.[1]) {
    const channel = parseChannelRef(channelRef);
    return {
      teamId: channel.teamId,
      channelId: channel.channelId,
      messageId: legacyMessage[1],
      channelRef: channel.channelRef,
      messageRef: buildMessageRef(channel.teamId, channel.channelId, legacyMessage[1])
    };
  }

  const channel = parseChannelRef(channelRef);
  return {
    teamId: channel.teamId,
    channelId: channel.channelId,
    messageId: messageRef,
    channelRef: channel.channelRef,
    messageRef: buildMessageRef(channel.teamId, channel.channelId, messageRef)
  };
}

function toChannelName(input: { incidentTitle: string; severity: string }): string {
  if (input.incidentTitle.toLowerCase().startsWith('inc-')) {
    return toSlug(input.incidentTitle).slice(0, 50);
  }

  const prefix = getTeamsIncidentChannelPrefix();
  const stem = toSlug(input.incidentTitle) || 'incident';
  return `${prefix}-${input.severity.toLowerCase()}-${stem}`.slice(0, 50);
}

function serializeAdaptiveCard(card: Record<string, unknown>): string {
  return JSON.stringify(card);
}

function buildCardAttachment(card: Record<string, unknown>): GraphChatMessageAttachment {
  return {
    '@odata.type': '#microsoft.graph.chatMessageAttachment',
    id: ADAPTIVE_CARD_ATTACHMENT_ID,
    contentType: ADAPTIVE_CARD_CONTENT_TYPE,
    content: serializeAdaptiveCard(card)
  };
}

function buildMessageBodyForCard(): GraphChatMessageBody {
  return {
    '@odata.type': '#microsoft.graph.itemBody',
    contentType: 'html',
    content: `<attachment id="${ADAPTIVE_CARD_ATTACHMENT_ID}"></attachment>`
  };
}

function extractResponseId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const maybeRecord = payload as Record<string, unknown>;
  return typeof maybeRecord['id'] === 'string' ? maybeRecord['id'] : null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function postAdaptiveCardMessage(input: {
  teamId: string;
  channelId: string;
  card: Record<string, unknown>;
}): Promise<{ messageId: string }> {
  const graphClient = createTeamsGraphClient();

  const requestBody: Parameters<typeof graphEndpoints.teams.channels.messages.create>[0] = {
    '@odata.type': '#microsoft.graph.chatMessage',
    body: buildMessageBodyForCard(),
    attachments: [buildCardAttachment(input.card)]
  };

  const pathParams: Parameters<typeof graphEndpoints.teams.channels.messages.create>[1] = {
    'team-id': input.teamId,
    'channel-id': input.channelId
  };

  const response = await graphClient.call(graphEndpoints.teams.channels.messages.create, requestBody, pathParams);
  const messageId = extractResponseId(response);

  if (!messageId) {
    throw new ValidationError('Teams message creation succeeded but no message id was returned');
  }

  return { messageId };
}

export async function getTeamsChatSettings(organizationId: string): Promise<TeamsChatSettings> {
  const row = await db
    .select({
      globalIncidentChannelRef: organizationChatSettings.globalIncidentChannelRef,
      autoCreateIncidentChannel: organizationChatSettings.autoCreateIncidentChannel,
      autoArchiveOnClose: organizationChatSettings.autoArchiveOnClose
    })
    .from(organizationChatSettings)
    .where(
      and(
        eq(organizationChatSettings.organizationId, organizationId),
        eq(organizationChatSettings.platform, 'teams')
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (row) {
    return row;
  }

  return {
    globalIncidentChannelRef: getTeamsGlobalIncidentChannel(),
    autoCreateIncidentChannel: true,
    autoArchiveOnClose: false
  };
}

export async function createTeamsIncidentChannel(input: {
  incidentTitle: string;
  severity: string;
}): Promise<{ channelRef: string; channelName: string }> {
  const channelName = toChannelName(input);

  if (!isTeamsGraphConfigured()) {
    return {
      channelRef: `teams:channel:${channelName}:${Date.now()}`,
      channelName
    };
  }

  const teamId = getTeamsIncidentTeamId();
  if (!teamId) {
    throw new ValidationError('TEAMS_INCIDENT_TEAM_ID is required to create Teams incident channels');
  }

  const graphClient = createTeamsGraphClient();
  const requestBody: Parameters<typeof graphEndpoints.teams.channels.create>[0] = {
    '@odata.type': '#microsoft.graph.channel',
    displayName: channelName,
    description: `Haveri incident channel for ${input.severity}`,
    membershipType: 'standard'
  };

  const pathParams: Parameters<typeof graphEndpoints.teams.channels.create>[1] = {
    'team-id': teamId
  };

  const response = await graphClient.call(graphEndpoints.teams.channels.create, requestBody, pathParams);
  const channelId = extractResponseId(response);

  if (!channelId) {
    throw new ValidationError('Teams channel creation succeeded but no channel id was returned');
  }

  return {
    channelRef: buildChannelRef(teamId, channelId),
    channelName
  };
}

export function buildTeamsIncidentCard(input: TeamsIncidentCardInput): Record<string, unknown> {
  const card = new AdaptiveCard(
    new TextBlock(`Incident ${input.severity}: ${input.title}`, {
      wrap: true,
      size: 'Medium',
      weight: 'Bolder'
    }),
    new TextBlock(`Status: ${input.status}`, {
      wrap: true,
      spacing: 'Small'
    }),
    new FactSet(
      new Fact('Incident ID', input.incidentId),
      new Fact('Facility', input.facilityName),
      new Fact('Responsible Lead', input.responsibleLead ?? 'Unassigned'),
      new Fact('Comms Lead', input.commsLead ?? 'Unassigned'),
      new Fact('Tags', input.tags.length > 0 ? input.tags.join(', ') : 'None'),
      new Fact('Incident Channel', input.channelRef),
      new Fact('Updated At', new Date().toISOString())
    ).withSpacing('Medium')
  )
    .with$schema('http://adaptivecards.io/schemas/adaptive-card.json')
    .withVersion('1.5');

  return JSON.parse(JSON.stringify(card)) as Record<string, unknown>;
}

export async function postTeamsGlobalIncidentCard(input: {
  channelRef: string;
  card: Record<string, unknown>;
}): Promise<{ messageRef: string; channelRef: string }> {
  if (!isTeamsGraphConfigured()) {
    const messageRef = `teams:message:${Date.now()}:${Math.round(Math.random() * 10000)}`;
    return { messageRef, channelRef: input.channelRef };
  }

  const channel = parseChannelRef(input.channelRef);
  const created = await postAdaptiveCardMessage({
    teamId: channel.teamId,
    channelId: channel.channelId,
    card: input.card
  });

  return {
    messageRef: buildMessageRef(channel.teamId, channel.channelId, created.messageId),
    channelRef: channel.channelRef
  };
}

export async function updateTeamsGlobalIncidentCard(input: {
  channelRef: string;
  messageRef: string;
  card: Record<string, unknown>;
}): Promise<{ messageRef: string; channelRef: string }> {
  if (!isTeamsGraphConfigured()) {
    return {
      messageRef: input.messageRef,
      channelRef: input.channelRef
    };
  }

  const message = parseMessageRef(input.messageRef, input.channelRef);
  const graphClient = createTeamsGraphClient();
  const requestBody: Parameters<typeof graphEndpoints.teams.channels.messages.update>[0] = {
    '@odata.type': '#microsoft.graph.chatMessage',
    body: buildMessageBodyForCard(),
    attachments: [buildCardAttachment(input.card)]
  };

  const pathParams: Parameters<typeof graphEndpoints.teams.channels.messages.update>[1] = {
    'team-id': message.teamId,
    'channel-id': message.channelId,
    'chatMessage-id': message.messageId
  };

  try {
    await graphClient.call(graphEndpoints.teams.channels.messages.update, requestBody, pathParams);

    return {
      messageRef: message.messageRef,
      channelRef: message.channelRef
    };
  } catch (error) {
    console.warn('Teams message update failed, posting replacement incident card', {
      channelRef: message.channelRef,
      messageRef: message.messageRef,
      error
    });

    const replacement = await postAdaptiveCardMessage({
      teamId: message.teamId,
      channelId: message.channelId,
      card: input.card
    });

    return {
      messageRef: buildMessageRef(message.teamId, message.channelId, replacement.messageId),
      channelRef: message.channelRef
    };
  }
}

export async function archiveTeamsIncidentChannel(input: { channelRef: string }): Promise<void> {
  if (!isTeamsGraphConfigured()) {
    return;
  }

  const channel = parseChannelRef(input.channelRef);
  const token = await getTeamsGraphAccessToken();
  const response = await fetch(
    `${getTeamsGraphBaseUrlRoot()}/v1.0/teams/${encodeURIComponent(channel.teamId)}/channels/${encodeURIComponent(channel.channelId)}/archive`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shouldSetSpoSiteReadOnlyForMembers: false
      })
    }
  );

  if (!response.ok) {
    throw new ValidationError(`Unable to archive Teams channel (${response.status})`);
  }
}

export async function addTeamsChannelMembers(input: {
  channelRef: string;
  platformUserIds: string[];
}): Promise<void> {
  if (!isTeamsGraphConfigured() || input.platformUserIds.length === 0) {
    return;
  }

  const channel = parseChannelRef(input.channelRef);
  const token = await getTeamsGraphAccessToken();

  for (const userId of [...new Set(input.platformUserIds)]) {
    const response = await fetch(
      `${getTeamsGraphBaseUrlRoot()}/v1.0/teams/${encodeURIComponent(channel.teamId)}/channels/${encodeURIComponent(channel.channelId)}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: [],
          'user@odata.bind': `${getTeamsGraphBaseUrlRoot()}/v1.0/users('${userId}')`
        })
      }
    );

    if (response.ok || response.status === 400 || response.status === 409) {
      continue;
    }

    throw new ValidationError(`Unable to add Teams channel member (${response.status})`);
  }
}

async function createOneOnOneChat(senderUserId: string, recipientUserId: string): Promise<string> {
  const token = await getTeamsGraphAccessToken();
  const response = await fetch(`${getTeamsGraphBaseUrlRoot()}/v1.0/chats`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chatType: 'oneOnOne',
      members: [
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `${getTeamsGraphBaseUrlRoot()}/v1.0/users('${senderUserId}')`
        },
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `${getTeamsGraphBaseUrlRoot()}/v1.0/users('${recipientUserId}')`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new ValidationError(`Unable to create Teams direct chat (${response.status})`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const chatId = extractResponseId(payload);
  if (!chatId) {
    throw new ValidationError('Teams direct chat creation succeeded but no chat id was returned');
  }

  return chatId;
}

async function postChatMessage(chatId: string, content: string): Promise<void> {
  const token = await getTeamsGraphAccessToken();
  const response = await fetch(
    `${getTeamsGraphBaseUrlRoot()}/v1.0/chats/${encodeURIComponent(chatId)}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        body: {
          contentType: 'html',
          content: `<div>${escapeHtml(content)}</div>`
        }
      })
    }
  );

  if (!response.ok) {
    throw new ValidationError(`Unable to send Teams direct message (${response.status})`);
  }
}

export async function sendTeamsDirectMessage(input: {
  platformUserId: string;
  content: string;
}): Promise<void> {
  if (!isTeamsGraphConfigured()) {
    return;
  }

  const senderUserId = getTeamsDirectMessageSenderUserId();
  if (!senderUserId) {
    console.warn('Skipping Teams direct message because TEAMS_DM_SENDER_USER_ID is not configured');
    return;
  }

  const chatId = await createOneOnOneChat(senderUserId, input.platformUserId);
  await postChatMessage(chatId, input.content);
}
