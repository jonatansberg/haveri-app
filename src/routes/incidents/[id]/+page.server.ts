import { asc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db/client';
import { members } from '$lib/server/db/schema';
import { acknowledgeIncidentEscalation } from '$lib/server/services/escalation-service';
import { updateFollowUpStatus } from '$lib/server/services/follow-up-service';
import { getIncidentDetail } from '$lib/server/services/incident-queries';
import { incidentService } from '$lib/server/services/incident-service';
import { syncGlobalIncidentAnnouncement } from '$lib/server/services/incident-workflow-service';
import { followUpStatuses, incidentSeverities, incidentStatuses } from '$lib/shared/domain';
import type { Actions, PageServerLoad } from './$types';

const statusSchema = z.object({
  status: z.enum(incidentStatuses)
});

const severitySchema = z.object({
  severity: z.enum(incidentSeverities)
});

const assignSchema = z.object({
  memberId: z.string().uuid()
});

const assignCommsSchema = z.object({
  memberId: z.string().uuid()
});

const resolveSchema = z.object({
  whatHappened: z.string().min(5),
  rootCause: z.string().min(3),
  resolution: z.string().min(3)
});

const closeSchema = z.object({
  followUps: z.string().optional().default('')
});

const followUpStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(followUpStatuses)
});

export const load: PageServerLoad = async ({ params, locals }) => {
  const [detail, memberList] = await Promise.all([
    getIncidentDetail(locals.organizationId, params.id),
    db
      .select({ id: members.id, name: members.name, role: members.role })
      .from(members)
      .where(eq(members.organizationId, locals.organizationId))
      .orderBy(asc(members.name))
  ]);

  return {
    ...detail,
    members: memberList
  };
};

export const actions: Actions = {
  status: async ({ request, params, locals }) => {
    const parsed = statusSchema.safeParse({
      status: (await request.formData()).get('status')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    await incidentService.updateStatus({
      organizationId: locals.organizationId,
      incidentId: params.id,
      newStatus: parsed.data.status
    });
    await syncGlobalIncidentAnnouncement({
      organizationId: locals.organizationId,
      incidentId: params.id
    });

    return { ok: true };
  },
  severity: async ({ request, params, locals }) => {
    const parsed = severitySchema.safeParse({
      severity: (await request.formData()).get('severity')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    await incidentService.changeSeverity({
      organizationId: locals.organizationId,
      incidentId: params.id,
      severity: parsed.data.severity
    });
    await syncGlobalIncidentAnnouncement({
      organizationId: locals.organizationId,
      incidentId: params.id
    });

    return { ok: true };
  },
  assign: async ({ request, params, locals }) => {
    const parsed = assignSchema.safeParse({
      memberId: (await request.formData()).get('memberId')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    await incidentService.assignLead({
      organizationId: locals.organizationId,
      incidentId: params.id,
      memberId: parsed.data.memberId
    });
    await syncGlobalIncidentAnnouncement({
      organizationId: locals.organizationId,
      incidentId: params.id
    });

    return { ok: true };
  },
  assignComms: async ({ request, params, locals }) => {
    const parsed = assignCommsSchema.safeParse({
      memberId: (await request.formData()).get('memberId')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    await incidentService.assignCommsLead({
      organizationId: locals.organizationId,
      incidentId: params.id,
      memberId: parsed.data.memberId
    });
    await syncGlobalIncidentAnnouncement({
      organizationId: locals.organizationId,
      incidentId: params.id
    });

    return { ok: true };
  },
  resolve: async ({ request, params, locals }) => {
    const formData = await request.formData();
    const parsed = resolveSchema.safeParse({
      whatHappened: formData.get('whatHappened'),
      rootCause: formData.get('rootCause'),
      resolution: formData.get('resolution')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    await incidentService.resolveIncident({
      organizationId: locals.organizationId,
      incidentId: params.id,
      summary: {
        whatHappened: parsed.data.whatHappened,
        rootCause: parsed.data.rootCause,
        resolution: parsed.data.resolution,
        impact: dataFromSummaryForm(formData)
      }
    });
    await syncGlobalIncidentAnnouncement({
      organizationId: locals.organizationId,
      incidentId: params.id
    });

    return { ok: true };
  },
  summary: async ({ request, params, locals }) => {
    const formData = await request.formData();
    const parsed = resolveSchema.safeParse({
      whatHappened: formData.get('whatHappened'),
      rootCause: formData.get('rootCause'),
      resolution: formData.get('resolution')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    await incidentService.annotateSummary({
      organizationId: locals.organizationId,
      incidentId: params.id,
      actorExternalId: locals.user?.id ?? null,
      summary: {
        whatHappened: parsed.data.whatHappened,
        rootCause: parsed.data.rootCause,
        resolution: parsed.data.resolution,
        impact: dataFromSummaryForm(formData)
      }
    });

    return { ok: true };
  },
  close: async ({ request, params, locals }) => {
    const parsed = closeSchema.safeParse({
      followUps: (await request.formData()).get('followUps')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    const followUps = parsed.data.followUps
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((description) => ({ description }));

    await incidentService.closeIncident({
      organizationId: locals.organizationId,
      incidentId: params.id,
      followUps
    });
    await syncGlobalIncidentAnnouncement({
      organizationId: locals.organizationId,
      incidentId: params.id
    });

    return { ok: true };
  },
  ack: async ({ params, locals }) => {
    await acknowledgeIncidentEscalation({
      organizationId: locals.organizationId,
      incidentId: params.id
    });
    await syncGlobalIncidentAnnouncement({
      organizationId: locals.organizationId,
      incidentId: params.id
    });

    return { ok: true };
  },
  followupStatus: async ({ request, locals }) => {
    const formData = await request.formData();
    const parsed = followUpStatusSchema.safeParse({
      id: formData.get('id'),
      status: formData.get('status')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    await updateFollowUpStatus({
      organizationId: locals.organizationId,
      followUpId: parsed.data.id,
      status: parsed.data.status
    });

    return { ok: true };
  }
};

function dataFromSummaryForm(formData: FormData): Record<string, unknown> {
  const duration = formData.get('impactDurationMinutes');
  const parsedDuration =
    typeof duration === 'string' && duration.trim().length > 0 ? Number(duration) : null;

  if (parsedDuration !== null && Number.isFinite(parsedDuration) && parsedDuration >= 0) {
    return { durationMinutes: parsedDuration };
  }

  return {};
}
