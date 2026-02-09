import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { withTransaction, db } from '$lib/server/db/client';
import {
  assets,
  escalationPolicies,
  escalationPolicySteps,
  facilities,
  incidentEscalationRuntime,
  incidentEscalationStepTargets,
  incidentAssets,
  incidentCurrentState,
  incidents
} from '$lib/server/db/schema';
import { appendIncidentEvent } from './event-store';
import { NotFoundError, ValidationError } from './errors';

interface PolicyConditions {
  severity?: string[] | string;
  areaId?: string[] | string;
  area?: string[] | string;
  assetType?: string[] | string;
  asset_type?: string[] | string;
  timeWindow?: string[] | string;
  time_window?: string[] | string;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  }

  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }

  return [];
}

function parseTimeToMinutes(raw: string): number | null {
  const [hourRaw, minuteRaw] = raw.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

function currentMinutesInTimezone(timezone: string): number {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone
  }).format(new Date());
  return parseTimeToMinutes(formatted) ?? 0;
}

function matchesTimeWindows(windows: string[], timezone: string): boolean {
  if (windows.length === 0) {
    return true;
  }

  const nowMinutes = currentMinutesInTimezone(timezone);
  return windows.some((window) => {
    const [startRaw, endRaw] = window.split('-');
    const start = parseTimeToMinutes(startRaw ?? '');
    const end = parseTimeToMinutes(endRaw ?? '');
    if (start === null || end === null) {
      return false;
    }
    if (start === end) {
      return true;
    }
    if (start < end) {
      return nowMinutes >= start && nowMinutes < end;
    }

    return nowMinutes >= start || nowMinutes < end;
  });
}

function hasAny(values: string[]): boolean {
  return values.some((value) => value.toLowerCase() === 'any');
}

export async function acknowledgeIncidentEscalation(input: {
  organizationId: string;
  incidentId: string;
  actorMemberId?: string | null;
}): Promise<void> {
  await withTransaction(async (tx) => {
    const [runtime] = await tx
      .select({
        incidentId: incidentEscalationRuntime.incidentId,
        latestStepOrder: incidentEscalationRuntime.latestStepOrder
      })
      .from(incidentEscalationRuntime)
      .where(
        and(
          eq(incidentEscalationRuntime.organizationId, input.organizationId),
          eq(incidentEscalationRuntime.incidentId, input.incidentId)
        )
      )
      .limit(1);

    if (!runtime) {
      throw new NotFoundError(`Escalation runtime missing for incident ${input.incidentId}`);
    }

    let canAcknowledgeStep = true;
    const stepOrder = runtime.latestStepOrder;
    if (stepOrder > 0 && input.actorMemberId) {
      const updatedTargets = await tx
        .update(incidentEscalationStepTargets)
        .set({
          acknowledgedAt: new Date().toISOString()
        })
        .where(
          and(
            eq(incidentEscalationStepTargets.organizationId, input.organizationId),
            eq(incidentEscalationStepTargets.incidentId, input.incidentId),
            eq(incidentEscalationStepTargets.stepOrder, stepOrder),
            eq(incidentEscalationStepTargets.targetMemberId, input.actorMemberId)
          )
        )
        .returning({ memberId: incidentEscalationStepTargets.targetMemberId });

      const hasStepTargets = await tx
        .select({ memberId: incidentEscalationStepTargets.targetMemberId })
        .from(incidentEscalationStepTargets)
        .where(
          and(
            eq(incidentEscalationStepTargets.organizationId, input.organizationId),
            eq(incidentEscalationStepTargets.incidentId, input.incidentId),
            eq(incidentEscalationStepTargets.stepOrder, stepOrder)
          )
        )
        .limit(1)
        .then((rows) => rows.length > 0);

      if (hasStepTargets && updatedTargets.length === 0) {
        canAcknowledgeStep = false;
      }
    }

    if (!canAcknowledgeStep) {
      throw new ValidationError('Only notified members can acknowledge this escalation step');
    }

    await tx
      .update(incidentEscalationRuntime)
      .set({
        ackedAt: new Date().toISOString(),
        ackedByMemberId: input.actorMemberId ?? null,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(incidentEscalationRuntime.organizationId, input.organizationId),
          eq(incidentEscalationRuntime.incidentId, input.incidentId)
        )
      );

    await appendIncidentEvent(tx, {
      organizationId: input.organizationId,
      incidentId: input.incidentId,
      eventType: 'escalation',
      eventVersion: 1,
      schemaVersion: 1,
      actorType: input.actorMemberId ? 'member' : 'system',
      actorMemberId: input.actorMemberId ?? null,
      payload: {
        action: 'acknowledged',
        stepOrder: runtime.latestStepOrder,
        acknowledgedByMemberId: input.actorMemberId ?? null
      }
    });
  });
}

export async function selectEscalationPolicyForIncident(input: {
  organizationId: string;
  incidentId: string;
}): Promise<{ policyId: string; steps: { stepOrder: number; delayMinutes: number; ifUnacked: boolean }[] } | null> {
  const [incident] = await db
    .select({
      facilityId: incidents.facilityId,
      areaId: incidents.areaId,
      severity: incidentCurrentState.severity,
      timezone: facilities.timezone
    })
    .from(incidents)
    .innerJoin(
      incidentCurrentState,
      and(
        eq(incidentCurrentState.incidentId, incidents.id),
        eq(incidentCurrentState.organizationId, incidents.organizationId)
      )
    )
    .innerJoin(facilities, eq(facilities.id, incidents.facilityId))
    .where(and(eq(incidents.organizationId, input.organizationId), eq(incidents.id, input.incidentId)))
    .limit(1);

  if (!incident) {
    throw new NotFoundError(`Incident ${input.incidentId} not found`);
  }

  const incidentAssetTypes = await db
    .select({
      assetType: assets.assetType
    })
    .from(incidentAssets)
    .innerJoin(
      assets,
      and(eq(assets.id, incidentAssets.assetId), eq(assets.organizationId, incidentAssets.organizationId))
    )
    .where(
      and(
        eq(incidentAssets.organizationId, input.organizationId),
        eq(incidentAssets.incidentId, input.incidentId)
      )
    )
    .then((rows) => new Set(rows.map((row) => row.assetType)));

  const policies = await db
    .select({
      id: escalationPolicies.id,
      priority: escalationPolicies.priority,
      conditions: escalationPolicies.conditions
    })
    .from(escalationPolicies)
    .where(
      and(
        eq(escalationPolicies.organizationId, input.organizationId),
        eq(escalationPolicies.isActive, true),
        or(eq(escalationPolicies.facilityId, incident.facilityId), isNull(escalationPolicies.facilityId))
      )
    );

  const matchingPolicies = policies
    .map((policy) => {
      const conditions = (policy.conditions ?? {}) as PolicyConditions;
      const severityConditions = asStringArray(conditions.severity);
      const areaConditions = asStringArray(conditions.areaId ?? conditions.area);
      const assetConditions = asStringArray(conditions.assetType ?? conditions.asset_type);
      const timeWindows = asStringArray(conditions.timeWindow ?? conditions.time_window);

      if (
        severityConditions.length > 0 &&
        !hasAny(severityConditions) &&
        !severityConditions.includes(incident.severity)
      ) {
        return null;
      }

      if (
        areaConditions.length > 0 &&
        !hasAny(areaConditions) &&
        (!incident.areaId || !areaConditions.includes(incident.areaId))
      ) {
        return null;
      }

      if (
        assetConditions.length > 0 &&
        !hasAny(assetConditions) &&
        !assetConditions.some((assetType) => incidentAssetTypes.has(assetType))
      ) {
        return null;
      }

      if (!matchesTimeWindows(timeWindows, incident.timezone)) {
        return null;
      }

      const specificity =
        (severityConditions.length > 0 && !hasAny(severityConditions) ? 1 : 0) +
        (areaConditions.length > 0 && !hasAny(areaConditions) ? 2 : 0) +
        (assetConditions.length > 0 && !hasAny(assetConditions) ? 4 : 0) +
        (timeWindows.length > 0 ? 1 : 0);

      return {
        id: policy.id,
        priority: policy.priority,
        specificity
      };
    })
    .filter((value): value is { id: string; priority: number; specificity: number } => value !== null)
    .sort((a, b) => {
      if (b.specificity !== a.specificity) {
        return b.specificity - a.specificity;
      }
      const aPriority =
        typeof a.priority === 'number' && Number.isFinite(a.priority)
          ? a.priority
          : Number.MAX_SAFE_INTEGER;
      const bPriority =
        typeof b.priority === 'number' && Number.isFinite(b.priority)
          ? b.priority
          : Number.MAX_SAFE_INTEGER;
      return aPriority - bPriority;
    });

  const matchingPolicy = matchingPolicies[0];

  if (!matchingPolicy) {
    return null;
  }

  const steps = await db
    .select({
      stepOrder: escalationPolicySteps.stepOrder,
      delayMinutes: escalationPolicySteps.delayMinutes,
      ifUnacked: escalationPolicySteps.ifUnacked
    })
    .from(escalationPolicySteps)
    .where(
      and(
        eq(escalationPolicySteps.organizationId, input.organizationId),
        eq(escalationPolicySteps.policyId, matchingPolicy.id)
      )
    )
    .orderBy(asc(escalationPolicySteps.stepOrder));

  return {
    policyId: matchingPolicy.id,
    steps
  };
}
