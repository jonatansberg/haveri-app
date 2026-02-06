import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { organizationChatSettings } from '$lib/server/db/schema';
import {
  getTeamsGlobalIncidentChannel,
  getTeamsIncidentChannelPrefix
} from '$lib/server/services/env';

export interface TeamsChatSettings {
  globalIncidentChannelRef: string;
  autoCreateIncidentChannel: boolean;
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

export async function getTeamsChatSettings(organizationId: string): Promise<TeamsChatSettings> {
  const row = await db
    .select({
      globalIncidentChannelRef: organizationChatSettings.globalIncidentChannelRef,
      autoCreateIncidentChannel: organizationChatSettings.autoCreateIncidentChannel
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
    autoCreateIncidentChannel: true
  };
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 36);
}

export async function createTeamsIncidentChannel(input: {
  incidentTitle: string;
  severity: string;
}): Promise<{ channelRef: string; channelName: string }> {
  const prefix = getTeamsIncidentChannelPrefix();
  const stem = toSlug(input.incidentTitle) || 'incident';
  const channelName = `${prefix}-${input.severity.toLowerCase()}-${stem}`;
  const channelRef = `teams:channel:${channelName}:${Date.now()}`;

  // Placeholder for real Teams channel creation API integration.
  console.log('createTeamsIncidentChannel', { channelName, channelRef });

  return { channelRef, channelName };
}

export function buildTeamsIncidentCard(input: TeamsIncidentCardInput): Record<string, unknown> {
  return {
    type: 'haveri.incident.summary.v1',
    incidentId: input.incidentId,
    title: input.title,
    severity: input.severity,
    status: input.status,
    facility: input.facilityName,
    channelRef: input.channelRef,
    responsibleLead: input.responsibleLead,
    commsLead: input.commsLead,
    tags: input.tags,
    updatedAt: new Date().toISOString()
  };
}

export async function postTeamsGlobalIncidentCard(input: {
  channelRef: string;
  card: Record<string, unknown>;
}): Promise<{ messageRef: string }> {
  const messageRef = `teams:message:${Date.now()}:${Math.round(Math.random() * 10000)}`;

  // Placeholder for real Teams message/card post API integration.
  console.log('postTeamsGlobalIncidentCard', {
    channelRef: input.channelRef,
    messageRef,
    card: input.card
  });

  return { messageRef };
}

export async function updateTeamsGlobalIncidentCard(input: {
  channelRef: string;
  messageRef: string;
  card: Record<string, unknown>;
}): Promise<void> {
  // Placeholder for real Teams card update API integration.
  console.log('updateTeamsGlobalIncidentCard', input);
}
