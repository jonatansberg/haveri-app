import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { facilities } from '$lib/server/db/schema';
import { getChatAdapter } from '$lib/server/adapters/chat/factory';
import { buildTeamsResolutionCard } from '$lib/server/adapters/teams/cards';
import { parseTeamsCommand } from './command-parser';
import { acknowledgeIncidentEscalation } from '$lib/server/services/escalation-service';
import { findIncidentByChannel } from '$lib/server/services/incident-queries';
import { persistIncidentAttachments } from '$lib/server/services/incident-attachment-service';
import { incidentService } from '$lib/server/services/incident-service';
import { logLatencyMetric, startLatencyTimer } from '$lib/server/services/latency-metrics';
import {
  declareIncidentWithWorkflow,
  syncGlobalIncidentAnnouncement
} from '$lib/server/services/incident-workflow-service';
import {
  resolveMemberByNameHint,
  resolveOrProvisionMemberByPlatformIdentity
} from '$lib/server/services/member-identity-service';
import { ValidationError } from '$lib/server/services/errors';

export interface TeamsInboundMessage {
  id: string;
  type: 'message';
  text: string;
  channelId: string;
  userId: string;
  tenantId?: string;
  userName?: string;
  timestamp?: string;
  attachments?: {
    name: string | null;
    contentType: string | null;
    contentUrl: string | null;
  }[];
  submission?: Record<string, unknown>;
}

function toRawPayload(payload: TeamsInboundMessage): Record<string, unknown> {
  return { ...payload };
}

async function resolveMemberId(input: {
  organizationId: string;
  platformUserId: string;
  platformTenantId?: string | undefined;
  displayName?: string | undefined;
}): Promise<string | null> {
  const row = await resolveOrProvisionMemberByPlatformIdentity({
    organizationId: input.organizationId,
    platform: 'teams',
    platformUserId: input.platformUserId,
    ...(input.platformTenantId !== undefined ? { platformTenantId: input.platformTenantId } : {}),
    ...(input.displayName !== undefined ? { displayName: input.displayName } : {})
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

async function resolveCommandIncidentId(input: {
  organizationId: string;
  platform: 'teams';
  channelRef: string;
  incidentId: string | null;
}): Promise<string> {
  if (input.incidentId) {
    return input.incidentId;
  }

  const activeIncident = await findIncidentByChannel(input.organizationId, input.platform, input.channelRef);
  if (!activeIncident) {
    throw new ValidationError(
      'No incident linked to this channel. Include an incident id in the command.'
    );
  }

  return activeIncident.id;
}

function parseMultiSelectSubmission(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
}

function parseFollowUpsFromCard(value: unknown): { description: string }[] {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split('\\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((description) => ({ description }));
}

export async function handleTeamsInbound(
  organizationId: string,
  payload: TeamsInboundMessage
): Promise<Record<string, unknown>> {
  const memberId = await resolveMemberId({
    organizationId,
    platformUserId: payload.userId,
    ...(payload.tenantId !== undefined ? { platformTenantId: payload.tenantId } : {}),
    ...(payload.userName !== undefined ? { displayName: payload.userName } : {})
  });
  const command = parseTeamsCommand(payload.text);
  const submissionAction =
    payload.submission && typeof payload.submission['haveriAction'] === 'string'
      ? payload.submission['haveriAction']
      : null;

  if (submissionAction === 'triage_submit') {
    const startedAt = startLatencyTimer();
    const explicitIncidentId =
      typeof payload.submission?.['incidentId'] === 'string' ? payload.submission['incidentId'] : null;
    const incidentId = await resolveCommandIncidentId({
      organizationId,
      platform: 'teams',
      channelRef: payload.channelId,
      incidentId: explicitIncidentId
    });

    const severityRaw = payload.submission?.['severity'];
    const severity = typeof severityRaw === 'string' ? severityRaw.toUpperCase() : 'SEV2';
    const areaIdRaw = payload.submission?.['areaId'];
    const areaId = typeof areaIdRaw === 'string' && areaIdRaw.length > 0 ? areaIdRaw : null;
    const assetIds = parseMultiSelectSubmission(payload.submission?.['assetIds']);
    const descriptionRaw = payload.submission?.['description'];
    const description = typeof descriptionRaw === 'string' && descriptionRaw.length > 0 ? descriptionRaw : null;

    await incidentService.recordTriageResponse({
      organizationId,
      incidentId,
      actorMemberId: memberId,
      severity: severity === 'SEV1' || severity === 'SEV2' || severity === 'SEV3' ? severity : 'SEV2',
      areaId,
      assetIds,
      description
    });
    await syncGlobalIncidentAnnouncement({
      organizationId,
      incidentId
    });

    logLatencyMetric({
      metric: 'triage_submission',
      startedAt,
      context: {
        organizationId,
        incidentId
      }
    });

    return {
      ok: true,
      action: 'triage_submitted',
      incidentId
    };
  }

  if (submissionAction === 'resolve_submit') {
    const explicitIncidentId =
      typeof payload.submission?.['incidentId'] === 'string' ? payload.submission['incidentId'] : null;
    const incidentId = await resolveCommandIncidentId({
      organizationId,
      platform: 'teams',
      channelRef: payload.channelId,
      incidentId: explicitIncidentId
    });

    const whatHappened = typeof payload.submission?.['whatHappened'] === 'string' ? payload.submission['whatHappened'] : '';
    const rootCause = typeof payload.submission?.['rootCause'] === 'string' ? payload.submission['rootCause'] : '';
    const resolution = typeof payload.submission?.['resolution'] === 'string' ? payload.submission['resolution'] : '';
    const followUps = parseFollowUpsFromCard(payload.submission?.['followUps']);

    await incidentService.resolveIncident({
      organizationId,
      incidentId,
      actorMemberId: memberId,
      summary: {
        whatHappened: whatHappened || 'Resolved via Teams card',
        rootCause: rootCause || 'Unspecified',
        resolution: resolution || whatHappened || 'Resolved via Teams card',
        impact: {}
      },
      followUps
    });
    await syncGlobalIncidentAnnouncement({
      organizationId,
      incidentId
    });

    return {
      ok: true,
      action: 'incident_resolved',
      incidentId
    };
  }

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
    const incidentId = await resolveCommandIncidentId({
      organizationId,
      platform: 'teams',
      channelRef: payload.channelId,
      incidentId: command.incidentId
    });

    const adapter = getChatAdapter('teams');
    const card = buildTeamsResolutionCard({
      incidentId,
      initialSummary: command.summaryText
    });
    try {
      await adapter.sendCard(payload.channelId, card);
    } catch (error) {
      console.warn('Failed to send Teams resolution card', {
        organizationId,
        incidentId,
        channelRef: payload.channelId,
        sourceEventId: payload.id,
        error
      });

      return {
        ok: false,
        action: 'resolution_card_failed',
        incidentId
      };
    }

    await incidentService.addEvent({
      event: {
        organizationId,
        incidentId,
        eventType: 'message',
        eventVersion: 1,
        schemaVersion: 1,
        actorType: memberId ? 'member' : 'integration',
        actorMemberId: memberId,
        actorExternalId: payload.userId,
        sourcePlatform: 'teams',
        sourceEventId: payload.id,
        payload: {
          source: 'teams_command',
          kind: 'resolution_prompted'
        },
        rawSourcePayload: toRawPayload(payload)
      }
    });

    return {
      ok: true,
      action: 'resolution_card_sent',
      incidentId
    };
  }

  if (command?.type === 'status') {
    const incidentId = await resolveCommandIncidentId({
      organizationId,
      platform: 'teams',
      channelRef: payload.channelId,
      incidentId: command.incidentId
    });

    await incidentService.updateStatus({
      organizationId,
      incidentId,
      newStatus: command.status,
      actorMemberId: memberId,
      actorExternalId: payload.userId
    });
    await syncGlobalIncidentAnnouncement({
      organizationId,
      incidentId
    });

    return {
      ok: true,
      action: 'incident_status_updated',
      incidentId,
      status: command.status
    };
  }

  if (command?.type === 'ack') {
    const incidentId = await resolveCommandIncidentId({
      organizationId,
      platform: 'teams',
      channelRef: payload.channelId,
      incidentId: command.incidentId
    });

    await acknowledgeIncidentEscalation({
      organizationId,
      incidentId,
      actorMemberId: memberId
    });
    await syncGlobalIncidentAnnouncement({
      organizationId,
      incidentId
    });

    return {
      ok: true,
      action: 'incident_acknowledged',
      incidentId
    };
  }

  if (command?.type === 'severity') {
    const incidentId = await resolveCommandIncidentId({
      organizationId,
      platform: 'teams',
      channelRef: payload.channelId,
      incidentId: command.incidentId
    });

    await incidentService.changeSeverity({
      organizationId,
      incidentId,
      severity: command.severity,
      actorMemberId: memberId
    });
    await syncGlobalIncidentAnnouncement({
      organizationId,
      incidentId
    });

    return {
      ok: true,
      action: 'incident_severity_updated',
      incidentId,
      severity: command.severity
    };
  }

  if (command?.type === 'lead') {
    const incidentId = await resolveCommandIncidentId({
      organizationId,
      platform: 'teams',
      channelRef: payload.channelId,
      incidentId: command.incidentId
    });
    const member = await resolveMemberByNameHint({
      organizationId,
      nameHint: command.memberRef
    });

    if (!member) {
      throw new ValidationError(`Unable to resolve member "${command.memberRef}"`);
    }

    await incidentService.assignLead({
      organizationId,
      incidentId,
      memberId: member.memberId,
      actorMemberId: memberId
    });
    await syncGlobalIncidentAnnouncement({
      organizationId,
      incidentId
    });

    return {
      ok: true,
      action: 'incident_lead_updated',
      incidentId,
      leadMemberId: member.memberId
    };
  }

  if (command?.type === 'unknown') {
    return {
      ok: false,
      action: 'unknown_command',
      help: 'Supported commands: /incident|/haveri [SEV1|SEV2|SEV3] <title> [@resp:Name] [@comms:Name], /status [id] <STATUS>, /investigating [id], /mitigated [id], /severity [id] <1|2|3|SEV1|SEV2|SEV3>, /lead [id] @Name, /resolve [id] <summary>, /ack [id>'
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

  const messageCaptureStartedAt = startLatencyTimer();
  let normalizedAttachments: Record<string, unknown>[] = (payload.attachments ?? []).map(
    (attachment) => ({
      name: attachment.name,
      contentType: attachment.contentType,
      contentUrl: attachment.contentUrl
    })
  );
  if ((payload.attachments ?? []).length > 0) {
    try {
      const stored = await persistIncidentAttachments({
        organizationId,
        incidentId: activeIncident.id,
        sourcePlatform: 'teams',
        sourceEventId: payload.id,
        attachments: payload.attachments ?? []
      });

      if (stored.length > 0) {
        normalizedAttachments = stored.map((attachment) => ({
          attachmentId: attachment.attachmentId,
          name: attachment.name,
          contentType: attachment.contentType,
          contentUrl: attachment.contentUrl,
          sourceContentUrl: attachment.sourceContentUrl,
          byteSize: attachment.byteSize
        }));
      }
    } catch (error) {
      console.warn('Failed to persist Teams attachments', {
        organizationId,
        incidentId: activeIncident.id,
        sourceEventId: payload.id,
        error
      });
    }
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
        timestamp: payload.timestamp ?? null,
        attachments: normalizedAttachments
      },
      rawSourcePayload: toRawPayload(payload)
    }
  });

  if (memberId) {
    try {
      await acknowledgeIncidentEscalation({
        organizationId,
        incidentId: activeIncident.id,
        actorMemberId: memberId
      });
      await syncGlobalIncidentAnnouncement({
        organizationId,
        incidentId: activeIncident.id
      });
    } catch {
      // Ignore acknowledgement errors for regular incident chat messages.
    }
  }

  logLatencyMetric({
    metric: 'message_capture',
    startedAt: messageCaptureStartedAt,
    context: {
      organizationId,
      incidentId: activeIncident.id,
      sourceEventId: payload.id
    }
  });

  return {
    ok: true,
    action: 'message_captured',
    incidentId: activeIncident.id
  };
}
