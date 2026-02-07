import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { members } from '$lib/server/db/schema';
import type { IncidentSeverity } from '$lib/shared/domain';
import { scheduleEscalationForIncident } from '$lib/server/queue/scheduler';
import {
  buildTeamsIncidentCard,
  createTeamsIncidentChannel,
  getTeamsChatSettings,
  postTeamsGlobalIncidentCard,
  updateTeamsGlobalIncidentCard
} from '$lib/server/adapters/teams/chat-ops';
import { getIncidentDetail } from './incident-queries';
import { incidentService } from './incident-service';
import { ValidationError } from './errors';

export const staticIncidentWorkflow = {
  version: 'v1-static',
  roles: {
    responsibleLead: {
      required: true,
      description: 'Primary owner responsible for coordination and decisions.'
    },
    commsLead: {
      required: false,
      description: 'Optional communications owner for stakeholder updates.'
    }
  },
  statuses: {
    DECLARED: {
      requiredRoles: ['responsibleLead']
    },
    INVESTIGATING: {
      requiredRoles: ['responsibleLead']
    },
    MITIGATED: {
      requiredRoles: ['responsibleLead']
    },
    RESOLVED: {
      requiredRoles: ['responsibleLead']
    },
    CLOSED: {
      requiredRoles: ['responsibleLead']
    }
  }
} as const;

export interface DeclareIncidentWorkflowInput {
  organizationId: string;
  title: string;
  severity: IncidentSeverity;
  declaredByMemberId?: string | null;
  facilityId: string;
  areaId?: string | null;
  assetIds?: string[];
  responsibleLeadMemberId?: string | null;
  commsLeadMemberId?: string | null;
  chatPlatform: 'teams' | 'web';
  sourceChannelRef?: string | null;
  tags?: string[];
  actorExternalId?: string | null;
  rawSourcePayload?: Record<string, unknown> | null;
}

async function resolveMemberInOrg(organizationId: string, memberId: string): Promise<string | null> {
  const member = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.organizationId, organizationId), eq(members.id, memberId)))
    .limit(1)
    .then((rows) => rows[0]);

  return member?.id ?? null;
}

async function resolveResponsibleLead(input: {
  organizationId: string;
  explicitResponsibleLeadMemberId?: string | null;
  declaredByMemberId?: string | null;
}): Promise<string | null> {
  if (input.explicitResponsibleLeadMemberId) {
    const explicit = await resolveMemberInOrg(input.organizationId, input.explicitResponsibleLeadMemberId);
    if (explicit) {
      return explicit;
    }
  }

  if (input.declaredByMemberId) {
    const declarer = await resolveMemberInOrg(input.organizationId, input.declaredByMemberId);
    if (declarer) {
      return declarer;
    }
  }

  const fallback = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.organizationId, input.organizationId))
    .orderBy(asc(members.createdAt))
    .limit(1)
    .then((rows) => rows[0]);

  return fallback?.id ?? null;
}

async function resolveCommsLead(input: {
  organizationId: string;
  commsLeadMemberId?: string | null;
}): Promise<string | null> {
  if (!input.commsLeadMemberId) {
    return null;
  }

  return resolveMemberInOrg(input.organizationId, input.commsLeadMemberId);
}

export async function declareIncidentWithWorkflow(
  input: DeclareIncidentWorkflowInput
): Promise<{ incidentId: string; channelRef: string; globalChannelRef: string | null }> {
  const responsibleLeadMemberId = await resolveResponsibleLead({
    organizationId: input.organizationId,
    ...(input.responsibleLeadMemberId !== undefined
      ? { explicitResponsibleLeadMemberId: input.responsibleLeadMemberId }
      : {}),
    ...(input.declaredByMemberId !== undefined
      ? { declaredByMemberId: input.declaredByMemberId }
      : {})
  });

  if (!responsibleLeadMemberId) {
    throw new ValidationError('A responsible lead is required to declare an incident');
  }

  const commsLeadMemberId = await resolveCommsLead({
    organizationId: input.organizationId,
    ...(input.commsLeadMemberId !== undefined
      ? { commsLeadMemberId: input.commsLeadMemberId }
      : {})
  });

  let incidentChannelRef = input.sourceChannelRef ?? `web:${Date.now()}`;
  let globalChannelRef: string | null = null;

  if (input.chatPlatform === 'teams') {
    const settings = await getTeamsChatSettings(input.organizationId);
    globalChannelRef = settings.globalIncidentChannelRef;

    if (settings.autoCreateIncidentChannel) {
      const channel = await createTeamsIncidentChannel({
        incidentTitle: input.title,
        severity: input.severity
      });
      incidentChannelRef = channel.channelRef;
    } else {
      incidentChannelRef = input.sourceChannelRef ?? `teams:${Date.now()}`;
    }
  }

  const incident = await incidentService.declareIncident({
    organizationId: input.organizationId,
    title: input.title,
    severity: input.severity,
    declaredByMemberId: input.declaredByMemberId ?? null,
    facilityId: input.facilityId,
    areaId: input.areaId ?? null,
    assignedToMemberId: responsibleLeadMemberId,
    commsLeadMemberId,
    chatPlatform: input.chatPlatform,
    chatChannelRef: incidentChannelRef,
    globalChannelRef,
    actorExternalId: input.actorExternalId ?? null,
    rawSourcePayload: input.rawSourcePayload ?? null,
    ...(input.assetIds ? { assetIds: input.assetIds } : {}),
    ...(input.tags ? { tags: input.tags } : {})
  });

  await incidentService.addEvent({
    event: {
      organizationId: input.organizationId,
      incidentId: incident.id,
      eventType: 'triage_response',
      eventVersion: 1,
      schemaVersion: 1,
      actorType: 'system',
      payload: {
        workflowVersion: staticIncidentWorkflow.version,
        responsibleLeadMemberId,
        commsLeadMemberId
      }
    }
  });

  if (input.chatPlatform === 'teams' && globalChannelRef) {
    const detail = await getIncidentDetail(input.organizationId, incident.id);
    const card = buildTeamsIncidentCard({
      incidentId: detail.incident.id,
      title: detail.incident.title,
      severity: detail.incident.severity,
      status: detail.incident.status,
      facilityName: detail.incident.facilityName,
      channelRef: detail.incident.chatChannelRef,
      responsibleLead: detail.incident.responsibleLead,
      commsLead: detail.incident.commsLead,
      tags: detail.incident.tags
    });

    const globalPost = await postTeamsGlobalIncidentCard({
      channelRef: globalChannelRef,
      card
    });

    await incidentService.setAnnouncementRefs({
      organizationId: input.organizationId,
      incidentId: incident.id,
      globalChannelRef: globalPost.channelRef,
      globalMessageRef: globalPost.messageRef
    });
  }

  try {
    await scheduleEscalationForIncident({
      organizationId: input.organizationId,
      incidentId: incident.id
    });
  } catch (error) {
    console.error('Failed to schedule escalation from workflow declaration', error);
  }

  return {
    incidentId: incident.id,
    channelRef: incidentChannelRef,
    globalChannelRef
  };
}

export async function syncGlobalIncidentAnnouncement(input: {
  organizationId: string;
  incidentId: string;
}): Promise<void> {
  const detail = await getIncidentDetail(input.organizationId, input.incidentId);

  if (detail.incident.chatPlatform !== 'teams') {
    return;
  }

  const settings = await getTeamsChatSettings(input.organizationId);
  const globalChannelRef = detail.incident.globalChannelRef ?? settings.globalIncidentChannelRef;

  if (!globalChannelRef) {
    return;
  }

  const card = buildTeamsIncidentCard({
    incidentId: detail.incident.id,
    title: detail.incident.title,
    severity: detail.incident.severity,
    status: detail.incident.status,
    facilityName: detail.incident.facilityName,
    channelRef: detail.incident.chatChannelRef,
    responsibleLead: detail.incident.responsibleLead,
    commsLead: detail.incident.commsLead,
    tags: detail.incident.tags
  });

  if (detail.incident.globalMessageRef) {
    const updated = await updateTeamsGlobalIncidentCard({
      channelRef: globalChannelRef,
      messageRef: detail.incident.globalMessageRef,
      card
    });

    if (
      !detail.incident.globalChannelRef ||
      detail.incident.globalMessageRef !== updated.messageRef ||
      detail.incident.globalChannelRef !== updated.channelRef
    ) {
      await incidentService.setAnnouncementRefs({
        organizationId: input.organizationId,
        incidentId: input.incidentId,
        globalChannelRef: updated.channelRef,
        globalMessageRef: updated.messageRef
      });
    }
    return;
  }

  const posted = await postTeamsGlobalIncidentCard({
    channelRef: globalChannelRef,
    card
  });

  await incidentService.setAnnouncementRefs({
    organizationId: input.organizationId,
    incidentId: input.incidentId,
    globalChannelRef: posted.channelRef,
    globalMessageRef: posted.messageRef
  });
}
