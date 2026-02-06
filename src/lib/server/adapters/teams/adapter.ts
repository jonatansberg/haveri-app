import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { facilities } from '$lib/server/db/schema';
import { parseTeamsCommand } from './command-parser';
import { acknowledgeIncidentEscalation } from '$lib/server/services/escalation-service';
import { findIncidentByChannel } from '$lib/server/services/incident-queries';
import { incidentService } from '$lib/server/services/incident-service';
import {
  declareIncidentWithWorkflow,
  syncGlobalIncidentAnnouncement
} from '$lib/server/services/incident-workflow-service';
import {
  resolveMemberByNameHint,
  resolveMemberByPlatformIdentity
} from '$lib/server/services/member-identity-service';
import { ValidationError } from '$lib/server/services/errors';

export interface TeamsInboundMessage {
  id: string;
  type: 'message';
  text: string;
  channelId: string;
  userId: string;
  userName?: string;
  timestamp?: string;
}

function toRawPayload(payload: TeamsInboundMessage): Record<string, unknown> {
  return { ...payload };
}

async function resolveMemberId(organizationId: string, platformUserId: string): Promise<string | null> {
  const row = await resolveMemberByPlatformIdentity({
    organizationId,
    platform: 'teams',
    platformUserId
  });
  return row?.memberId ?? null;
}

async function resolveDefaultFacilityId(organizationId: string): Promise<string> {
  const facility = await db
    .select({ id: facilities.id })
    .from(facilities)
    .where(eq(facilities.organizationId, organizationId))
    .orderBy(asc(facilities.createdAt))
    .limit(1)
    .then((rows) => rows[0]);

  if (!facility) {
    throw new ValidationError('No facility configured for organization');
  }

  return facility.id;
}

export async function handleTeamsInbound(
  organizationId: string,
  payload: TeamsInboundMessage
): Promise<Record<string, unknown>> {
  const memberId = await resolveMemberId(organizationId, payload.userId);
  const command = parseTeamsCommand(payload.text);

  if (command?.type === 'declare') {
    const facilityId = await resolveDefaultFacilityId(organizationId);
    const responsibleFromToken = command.responsibleLeadRef
      ? await resolveMemberByNameHint({
          organizationId,
          nameHint: command.responsibleLeadRef
        })
      : null;
    const commsFromToken = command.commsLeadRef
      ? await resolveMemberByNameHint({
          organizationId,
          nameHint: command.commsLeadRef
        })
      : null;

    const workflowResult = await declareIncidentWithWorkflow({
      organizationId,
      title: command.title,
      severity: command.severity,
      declaredByMemberId: memberId,
      facilityId,
      responsibleLeadMemberId: responsibleFromToken?.memberId ?? memberId,
      commsLeadMemberId: commsFromToken?.memberId ?? null,
      chatPlatform: 'teams',
      sourceChannelRef: payload.channelId,
      actorExternalId: payload.userId,
      rawSourcePayload: toRawPayload(payload)
    });

    return {
      ok: true,
      action: 'incident_declared',
      incidentId: workflowResult.incidentId,
      incidentChannelRef: workflowResult.channelRef,
      globalChannelRef: workflowResult.globalChannelRef
    };
  }

  if (command?.type === 'resolve') {
    await incidentService.resolveIncident({
      organizationId,
      incidentId: command.incidentId,
      actorMemberId: memberId,
      summary: {
        whatHappened: command.summaryText,
        rootCause: 'Unknown (resolved through chat command)',
        resolution: command.summaryText,
        impact: {}
      }
    });
    await syncGlobalIncidentAnnouncement({
      organizationId,
      incidentId: command.incidentId
    });

    return {
      ok: true,
      action: 'incident_resolved',
      incidentId: command.incidentId
    };
  }

  if (command?.type === 'status') {
    await incidentService.updateStatus({
      organizationId,
      incidentId: command.incidentId,
      newStatus: command.status,
      actorMemberId: memberId,
      actorExternalId: payload.userId
    });
    await syncGlobalIncidentAnnouncement({
      organizationId,
      incidentId: command.incidentId
    });

    return {
      ok: true,
      action: 'incident_status_updated',
      incidentId: command.incidentId,
      status: command.status
    };
  }

  if (command?.type === 'ack') {
    await acknowledgeIncidentEscalation({
      organizationId,
      incidentId: command.incidentId,
      actorMemberId: memberId
    });
    await syncGlobalIncidentAnnouncement({
      organizationId,
      incidentId: command.incidentId
    });

    return {
      ok: true,
      action: 'incident_acknowledged',
      incidentId: command.incidentId
    };
  }

  if (command?.type === 'unknown') {
    return {
      ok: false,
      action: 'unknown_command',
      help: 'Supported commands: /incident <SEV1|SEV2|SEV3> <title> [@resp:Name] [@comms:Name], /status <id> <STATUS>, /resolve <id> <summary>, /ack <id>'
    };
  }

  const activeIncident = await findIncidentByChannel(organizationId, 'teams', payload.channelId);

  if (!activeIncident) {
    return {
      ok: true,
      action: 'ignored',
      reason: 'No incident linked to channel'
    };
  }

  await incidentService.addEvent({
    event: {
      organizationId,
      incidentId: activeIncident.id,
      eventType: 'message',
      eventVersion: 1,
      schemaVersion: 1,
      actorType: memberId ? 'member' : 'integration',
      actorMemberId: memberId,
      actorExternalId: payload.userId,
      sourcePlatform: 'teams',
      sourceEventId: payload.id,
      payload: {
        text: payload.text,
        userName: payload.userName ?? null,
        timestamp: payload.timestamp ?? null
      },
      rawSourcePayload: toRawPayload(payload)
    }
  });

  return {
    ok: true,
    action: 'message_captured',
    incidentId: activeIncident.id
  };
}
