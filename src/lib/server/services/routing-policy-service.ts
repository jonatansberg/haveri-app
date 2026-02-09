import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm';
import { db, withTransaction } from '$lib/server/db/client';
import { escalationPolicies, escalationPolicySteps } from '$lib/server/db/schema';
import { NotFoundError, ValidationError } from '$lib/server/services/errors';

export interface RoutingPolicyConditions {
  severity?: string[];
  area?: string[];
  assetType?: string[];
  timeWindow?: string[];
}

export interface RoutingPolicyStepInput {
  delayMinutes: number;
  notifyType: 'team' | 'member';
  notifyTargetIds: string[];
  ifUnacked?: boolean;
}

export interface RoutingPolicyRecord {
  id: string;
  organizationId: string;
  name: string;
  facilityId: string | null;
  priority: number;
  isActive: boolean;
  conditions: RoutingPolicyConditions;
  steps: {
    id: string;
    stepOrder: number;
    delayMinutes: number;
    notifyType: 'team' | 'member';
    notifyTargetIds: string[];
    ifUnacked: boolean;
  }[];
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0))].sort(
    (a, b) => a.localeCompare(b)
  );
}

function normalizeTimeWindow(value: unknown): string[] {
  return normalizeStringArray(value).filter((entry) => /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(entry));
}

function normalizeConditions(value: unknown): RoutingPolicyConditions {
  const raw = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

  const normalized: RoutingPolicyConditions = {};
  const severity = normalizeStringArray(raw['severity']);
  const area = normalizeStringArray(raw['area'] ?? raw['areaId']);
  const assetType = normalizeStringArray(raw['assetType'] ?? raw['asset_type']);
  const timeWindow = normalizeTimeWindow(raw['timeWindow'] ?? raw['time_window']);

  if (severity.length > 0) {
    normalized.severity = severity;
  }
  if (area.length > 0) {
    normalized.area = area;
  }
  if (assetType.length > 0) {
    normalized.assetType = assetType;
  }
  if (timeWindow.length > 0) {
    normalized.timeWindow = timeWindow;
  }

  return normalized;
}

function normalizeSteps(value: unknown): RoutingPolicyStepInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError('Routing policy requires at least one step');
  }

  return value.map((step, index) => {
    if (!step || typeof step !== 'object') {
      throw new ValidationError(`Invalid step at position ${index + 1}`);
    }

    const record = step as Record<string, unknown>;
    const notifyType = record['notifyType'];
    if (notifyType !== 'team' && notifyType !== 'member') {
      throw new ValidationError(`Step ${index + 1} has unsupported notifyType`);
    }

    const delayMinutes = Number(record['delayMinutes']);
    if (!Number.isInteger(delayMinutes) || delayMinutes < 0) {
      throw new ValidationError(`Step ${index + 1} delayMinutes must be a non-negative integer`);
    }

    const notifyTargetIds = normalizeStringArray(record['notifyTargetIds']);
    if (notifyTargetIds.length === 0) {
      throw new ValidationError(`Step ${index + 1} requires at least one notify target`);
    }

    return {
      delayMinutes,
      notifyType,
      notifyTargetIds,
      ifUnacked: record['ifUnacked'] === undefined ? true : Boolean(record['ifUnacked'])
    };
  });
}

function buildConditionSignature(facilityId: string | null, conditions: RoutingPolicyConditions): string {
  return JSON.stringify({
    facilityId: facilityId ?? 'any',
    conditions
  });
}

async function findConditionWarnings(input: {
  organizationId: string;
  policyId: string;
  facilityId: string | null;
  conditions: RoutingPolicyConditions;
  isActive: boolean;
}): Promise<string[]> {
  if (!input.isActive) {
    return [];
  }

  const signature = buildConditionSignature(input.facilityId, input.conditions);

  const peers = await db
    .select({
      id: escalationPolicies.id,
      name: escalationPolicies.name,
      facilityId: escalationPolicies.facilityId,
      conditions: escalationPolicies.conditions,
      isActive: escalationPolicies.isActive
    })
    .from(escalationPolicies)
    .where(
      and(
        eq(escalationPolicies.organizationId, input.organizationId),
        eq(escalationPolicies.isActive, true),
        ne(escalationPolicies.id, input.policyId)
      )
    );

  const duplicates = peers.filter((peer) => {
    const peerConditions = normalizeConditions(peer.conditions ?? {});
    return buildConditionSignature(peer.facilityId, peerConditions) === signature;
  });

  if (duplicates.length === 0) {
    return [];
  }

  return [
    `Condition set duplicates active policies: ${duplicates.map((duplicate) => duplicate.name).join(', ')}`
  ];
}

function groupPolicyRows(input: {
  policies: {
    id: string;
    organizationId: string;
    name: string;
    facilityId: string | null;
    priority: number;
    isActive: boolean;
    conditions: Record<string, unknown>;
  }[];
  steps: {
    id: string;
    policyId: string;
    stepOrder: number;
    delayMinutes: number;
    notifyType: string;
    notifyTargetIds: string[];
    ifUnacked: boolean;
  }[];
}): RoutingPolicyRecord[] {
  return input.policies.map((policy) => {
    const policySteps = input.steps
      .filter((step) => step.policyId === policy.id)
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((step) => ({
        id: step.id,
        stepOrder: step.stepOrder,
        delayMinutes: step.delayMinutes,
        notifyType: step.notifyType as 'team' | 'member',
        notifyTargetIds: step.notifyTargetIds,
        ifUnacked: step.ifUnacked
      }));

    return {
      id: policy.id,
      organizationId: policy.organizationId,
      name: policy.name,
      facilityId: policy.facilityId,
      priority: policy.priority,
      isActive: policy.isActive,
      conditions: normalizeConditions(policy.conditions),
      steps: policySteps
    };
  });
}

export async function listRoutingPolicies(organizationId: string): Promise<RoutingPolicyRecord[]> {
  const policies = await db
    .select({
      id: escalationPolicies.id,
      organizationId: escalationPolicies.organizationId,
      name: escalationPolicies.name,
      facilityId: escalationPolicies.facilityId,
      priority: escalationPolicies.priority,
      isActive: escalationPolicies.isActive,
      conditions: escalationPolicies.conditions
    })
    .from(escalationPolicies)
    .where(eq(escalationPolicies.organizationId, organizationId))
    .orderBy(asc(escalationPolicies.priority), asc(escalationPolicies.createdAt));

  if (policies.length === 0) {
    return [];
  }

  const steps = await db
    .select({
      id: escalationPolicySteps.id,
      policyId: escalationPolicySteps.policyId,
      stepOrder: escalationPolicySteps.stepOrder,
      delayMinutes: escalationPolicySteps.delayMinutes,
      notifyType: escalationPolicySteps.notifyType,
      notifyTargetIds: escalationPolicySteps.notifyTargetIds,
      ifUnacked: escalationPolicySteps.ifUnacked
    })
    .from(escalationPolicySteps)
    .where(
      and(
        eq(escalationPolicySteps.organizationId, organizationId),
        inArray(
          escalationPolicySteps.policyId,
          policies.map((policy) => policy.id)
        )
      )
    )
    .orderBy(asc(escalationPolicySteps.stepOrder));

  return groupPolicyRows({ policies, steps });
}

export async function createRoutingPolicy(input: {
  organizationId: string;
  name: string;
  facilityId?: string | null;
  isActive?: boolean;
  conditions?: unknown;
  steps: unknown;
}): Promise<{ policy: RoutingPolicyRecord; warnings: string[] }> {
  const normalizedConditions = normalizeConditions(input.conditions ?? {});
  const normalizedSteps = normalizeSteps(input.steps);
  const isActive = input.isActive ?? true;

  const maxPriority = await db
    .select({
      value: sql<number>`COALESCE(MAX(${escalationPolicies.priority}), 0)`
    })
    .from(escalationPolicies)
    .where(eq(escalationPolicies.organizationId, input.organizationId))
    .then((rows) => rows[0]?.value ?? 0);

  const createdPolicy = await withTransaction(async (tx) => {
    const [policy] = await tx
      .insert(escalationPolicies)
      .values({
        organizationId: input.organizationId,
        name: input.name,
        facilityId: input.facilityId ?? null,
        priority: maxPriority + 1,
        isActive,
        conditions: normalizedConditions as Record<string, unknown>
      })
      .returning({ id: escalationPolicies.id });

    if (!policy) {
      throw new ValidationError('Failed to create routing policy');
    }

    await tx.insert(escalationPolicySteps).values(
      normalizedSteps.map((step, index) => ({
        policyId: policy.id,
        organizationId: input.organizationId,
        stepOrder: index + 1,
        delayMinutes: step.delayMinutes,
        notifyType: step.notifyType,
        notifyTargetIds: step.notifyTargetIds,
        ifUnacked: step.ifUnacked ?? true
      }))
    );

    return policy;
  });

  const warnings = await findConditionWarnings({
    organizationId: input.organizationId,
    policyId: createdPolicy.id,
    facilityId: input.facilityId ?? null,
    conditions: normalizedConditions,
    isActive
  });

  const policy = (await listRoutingPolicies(input.organizationId)).find(
    (entry) => entry.id === createdPolicy.id
  );

  if (!policy) {
    throw new ValidationError('Unable to load created routing policy');
  }

  return { policy, warnings };
}

export async function updateRoutingPolicy(input: {
  organizationId: string;
  policyId: string;
  name?: string;
  facilityId?: string | null;
  isActive?: boolean;
  conditions?: unknown;
  steps?: unknown;
}): Promise<{ policy: RoutingPolicyRecord; warnings: string[] }> {
  const existing = await db
    .select({
      id: escalationPolicies.id,
      name: escalationPolicies.name,
      facilityId: escalationPolicies.facilityId,
      isActive: escalationPolicies.isActive,
      conditions: escalationPolicies.conditions
    })
    .from(escalationPolicies)
    .where(
      and(
        eq(escalationPolicies.organizationId, input.organizationId),
        eq(escalationPolicies.id, input.policyId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) {
    throw new NotFoundError(`Routing policy ${input.policyId} not found`);
  }

  const normalizedConditions = normalizeConditions(input.conditions ?? existing.conditions ?? {});
  const normalizedSteps = input.steps === undefined ? null : normalizeSteps(input.steps);
  const name = input.name ?? existing.name;
  const facilityId = input.facilityId === undefined ? existing.facilityId : input.facilityId;
  const isActive = input.isActive ?? existing.isActive;

  await withTransaction(async (tx) => {
    await tx
      .update(escalationPolicies)
      .set({
        name,
        facilityId: facilityId ?? null,
        isActive,
        conditions: normalizedConditions as Record<string, unknown>
      })
      .where(
        and(
          eq(escalationPolicies.organizationId, input.organizationId),
          eq(escalationPolicies.id, input.policyId)
        )
      );

    if (normalizedSteps) {
      await tx
        .delete(escalationPolicySteps)
        .where(
          and(
            eq(escalationPolicySteps.organizationId, input.organizationId),
            eq(escalationPolicySteps.policyId, input.policyId)
          )
        );

      await tx.insert(escalationPolicySteps).values(
        normalizedSteps.map((step, index) => ({
          policyId: input.policyId,
          organizationId: input.organizationId,
          stepOrder: index + 1,
          delayMinutes: step.delayMinutes,
          notifyType: step.notifyType,
          notifyTargetIds: step.notifyTargetIds,
          ifUnacked: step.ifUnacked ?? true
        }))
      );
    }
  });

  const warnings = await findConditionWarnings({
    organizationId: input.organizationId,
    policyId: input.policyId,
    facilityId: facilityId ?? null,
    conditions: normalizedConditions,
    isActive
  });

  const policy = (await listRoutingPolicies(input.organizationId)).find(
    (entry) => entry.id === input.policyId
  );

  if (!policy) {
    throw new ValidationError('Unable to load updated routing policy');
  }

  return { policy, warnings };
}

export async function deleteRoutingPolicy(input: {
  organizationId: string;
  policyId: string;
}): Promise<void> {
  const deleted = await db
    .delete(escalationPolicies)
    .where(
      and(
        eq(escalationPolicies.organizationId, input.organizationId),
        eq(escalationPolicies.id, input.policyId)
      )
    )
    .returning({ id: escalationPolicies.id });

  if (deleted.length === 0) {
    throw new NotFoundError(`Routing policy ${input.policyId} not found`);
  }
}

export async function reorderRoutingPolicies(input: {
  organizationId: string;
  orderedPolicyIds: string[];
}): Promise<RoutingPolicyRecord[]> {
  if (input.orderedPolicyIds.length === 0) {
    return [];
  }

  const existing = await db
    .select({ id: escalationPolicies.id })
    .from(escalationPolicies)
    .where(eq(escalationPolicies.organizationId, input.organizationId));

  const existingIds = existing.map((row) => row.id).sort((a, b) => a.localeCompare(b));
  const orderedIds = [...new Set(input.orderedPolicyIds)].sort((a, b) => a.localeCompare(b));
  if (existingIds.length !== orderedIds.length || existingIds.some((id, index) => id !== orderedIds[index])) {
    throw new ValidationError('orderedPolicyIds must include every policy in the organization exactly once');
  }

  await withTransaction(async (tx) => {
    for (const [index, policyId] of input.orderedPolicyIds.entries()) {
      await tx
        .update(escalationPolicies)
        .set({ priority: index + 1 })
        .where(
          and(
            eq(escalationPolicies.organizationId, input.organizationId),
            eq(escalationPolicies.id, policyId)
          )
        );
    }
  });

  return listRoutingPolicies(input.organizationId);
}
