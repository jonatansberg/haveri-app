import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import {
  archiveTeamsIncidentChannel,
  getTeamsChatSettings
} from '$lib/server/adapters/teams/chat-ops';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { getIncidentDetail } from '$lib/server/services/incident-queries';
import { syncGlobalIncidentAnnouncement } from '$lib/server/services/incident-workflow-service';
import { incidentService } from '$lib/server/services/incident-service';
import type { RequestHandler } from './$types';

const payloadSchema = z.object({
  followUps: z
    .array(
      z.object({
        description: z.string().min(3),
        assignedToMemberId: z.string().uuid().optional().nullable(),
        dueDate: z.string().date().optional().nullable()
      })
    )
    .default([])
});

export const POST: RequestHandler = async (event) => {
  requireUser(event);
  const organizationId = getOrganizationId(event);

  try {
    const payload = payloadSchema.parse(await readJson<unknown>(event.request));

    await incidentService.closeIncident({
      organizationId,
      incidentId: event.params.id,
      followUps: payload.followUps.map((followUp) => ({
        description: followUp.description,
        assignedToMemberId: followUp.assignedToMemberId ?? null,
        dueDate: followUp.dueDate ?? null
      }))
    });
    await syncGlobalIncidentAnnouncement({
      organizationId,
      incidentId: event.params.id
    });

    const incidentDetail = await getIncidentDetail(organizationId, event.params.id);
    const chatSettings = await getTeamsChatSettings(organizationId);
    if (
      incidentDetail.incident.chatPlatform === 'teams' &&
      chatSettings.autoArchiveOnClose
    ) {
      await archiveTeamsIncidentChannel({
        channelRef: incidentDetail.incident.chatChannelRef
      });
    }

    return json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: error.flatten() }, { status: 400 });
    }

    return toErrorResponse(error);
  }
};
