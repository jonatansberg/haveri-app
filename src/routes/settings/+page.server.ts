import { and, asc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db/client';
import {
  areas,
  assets,
  facilities,
  organizations,
  teamMembers,
  teams,
  members
} from '$lib/server/db/schema';
import {
  createRoutingPolicy,
  deleteRoutingPolicy,
  listRoutingPolicies,
  reorderRoutingPolicies,
  updateRoutingPolicy
} from '$lib/server/services/routing-policy-service';
import type { Actions, PageServerLoad } from './$types';

const organizationSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/)
});

const facilitySchema = z.object({
  name: z.string().min(2),
  timezone: z.string().min(2)
});

const areaSchema = z.object({
  facilityId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional().nullable()
});

const assetSchema = z.object({
  areaId: z.string().uuid(),
  name: z.string().min(2),
  assetType: z.string().min(2),
  metadataJson: z.string().optional().nullable()
});

const teamSchema = z.object({
  name: z.string().min(2),
  facilityId: z.string().uuid().optional().nullable(),
  shiftInfoJson: z.string().optional().nullable()
});

function parseJsonObject(raw: string | null | undefined): Record<string, unknown> {
  if (!raw || raw.trim().length === 0) {
    return {};
  }

  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object');
  }

  return parsed as Record<string, unknown>;
}

function normalizeNullable(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const load: PageServerLoad = async ({ locals }) => {
  const [organization, facilityList, areaList, assetList, teamList, memberList, memberships, routingPolicies] =
    await Promise.all([
      db
        .select({ id: organizations.id, name: organizations.name, slug: organizations.slug })
        .from(organizations)
        .where(eq(organizations.id, locals.organizationId))
        .limit(1)
        .then((rows) => rows[0]),
      db
        .select({ id: facilities.id, name: facilities.name, timezone: facilities.timezone })
        .from(facilities)
        .where(eq(facilities.organizationId, locals.organizationId))
        .orderBy(asc(facilities.name)),
      db
        .select({
          id: areas.id,
          facilityId: areas.facilityId,
          name: areas.name,
          description: areas.description
        })
        .from(areas)
        .where(eq(areas.organizationId, locals.organizationId))
        .orderBy(asc(areas.name)),
      db
        .select({
          id: assets.id,
          areaId: assets.areaId,
          name: assets.name,
          assetType: assets.assetType,
          metadata: assets.metadata
        })
        .from(assets)
        .where(eq(assets.organizationId, locals.organizationId))
        .orderBy(asc(assets.name)),
      db
        .select({
          id: teams.id,
          name: teams.name,
          facilityId: teams.facilityId,
          shiftInfo: teams.shiftInfo
        })
        .from(teams)
        .where(eq(teams.organizationId, locals.organizationId))
        .orderBy(asc(teams.name)),
      db
        .select({ id: members.id, name: members.name, role: members.role })
        .from(members)
        .where(eq(members.organizationId, locals.organizationId))
        .orderBy(asc(members.name)),
      db
        .select({ teamId: teamMembers.teamId, memberId: teamMembers.memberId })
        .from(teamMembers)
        .where(eq(teamMembers.organizationId, locals.organizationId)),
      listRoutingPolicies(locals.organizationId)
    ]);

  return {
    organization,
    facilities: facilityList,
    areas: areaList,
    assets: assetList,
    teams: teamList,
    members: memberList,
    memberships,
    routingPolicies
  };
};

export const actions: Actions = {
  updateOrganization: async ({ request, locals }) => {
    const formData = await request.formData();
    const parsed = organizationSchema.safeParse({
      name: formData.get('name'),
      slug: formData.get('slug')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    await db
      .update(organizations)
      .set({
        name: parsed.data.name,
        slug: parsed.data.slug
      })
      .where(eq(organizations.id, locals.organizationId));

    return { ok: true };
  },

  createFacility: async ({ request, locals }) => {
    const formData = await request.formData();
    const parsed = facilitySchema.safeParse({
      name: formData.get('name'),
      timezone: formData.get('timezone')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    await db.insert(facilities).values({
      organizationId: locals.organizationId,
      name: parsed.data.name,
      timezone: parsed.data.timezone
    });

    return { ok: true };
  },

  updateFacility: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = normalizeNullable(formData.get('id'));
    const parsed = facilitySchema.safeParse({
      name: formData.get('name'),
      timezone: formData.get('timezone')
    });

    if (!id || !parsed.success) {
      return fail(400, { error: parsed.success ? 'Invalid facility id' : parsed.error.flatten() });
    }

    await db
      .update(facilities)
      .set({
        name: parsed.data.name,
        timezone: parsed.data.timezone
      })
      .where(and(eq(facilities.organizationId, locals.organizationId), eq(facilities.id, id)));

    return { ok: true };
  },

  deleteFacility: async ({ request, locals }) => {
    const id = normalizeNullable((await request.formData()).get('id'));
    if (!id) {
      return fail(400, { error: 'Invalid facility id' });
    }

    await db
      .delete(facilities)
      .where(and(eq(facilities.organizationId, locals.organizationId), eq(facilities.id, id)));

    return { ok: true };
  },

  createArea: async ({ request, locals }) => {
    const formData = await request.formData();
    const parsed = areaSchema.safeParse({
      facilityId: formData.get('facilityId'),
      name: formData.get('name'),
      description: normalizeNullable(formData.get('description'))
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    await db.insert(areas).values({
      organizationId: locals.organizationId,
      facilityId: parsed.data.facilityId,
      name: parsed.data.name,
      description: parsed.data.description ?? null
    });

    return { ok: true };
  },

  updateArea: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = normalizeNullable(formData.get('id'));
    const name = normalizeNullable(formData.get('name'));
    const description = normalizeNullable(formData.get('description'));
    if (!id || !name) {
      return fail(400, { error: 'Invalid area payload' });
    }

    await db
      .update(areas)
      .set({ name, description })
      .where(and(eq(areas.organizationId, locals.organizationId), eq(areas.id, id)));

    return { ok: true };
  },

  deleteArea: async ({ request, locals }) => {
    const id = normalizeNullable((await request.formData()).get('id'));
    if (!id) {
      return fail(400, { error: 'Invalid area id' });
    }

    await db
      .delete(areas)
      .where(and(eq(areas.organizationId, locals.organizationId), eq(areas.id, id)));

    return { ok: true };
  },

  createAsset: async ({ request, locals }) => {
    const formData = await request.formData();
    const parsed = assetSchema.safeParse({
      areaId: formData.get('areaId'),
      name: formData.get('name'),
      assetType: formData.get('assetType'),
      metadataJson: normalizeNullable(formData.get('metadataJson'))
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    let metadata: Record<string, unknown> = {};
    try {
      metadata = parseJsonObject(parsed.data.metadataJson);
    } catch {
      return fail(400, { error: 'metadataJson must be a JSON object' });
    }

    await db.insert(assets).values({
      organizationId: locals.organizationId,
      areaId: parsed.data.areaId,
      name: parsed.data.name,
      assetType: parsed.data.assetType,
      metadata
    });

    return { ok: true };
  },

  updateAsset: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = normalizeNullable(formData.get('id'));
    const areaId = normalizeNullable(formData.get('areaId'));
    const name = normalizeNullable(formData.get('name'));
    const assetType = normalizeNullable(formData.get('assetType'));

    if (!id || !areaId || !name || !assetType) {
      return fail(400, { error: 'Invalid asset payload' });
    }

    let metadata: Record<string, unknown> = {};
    try {
      metadata = parseJsonObject(normalizeNullable(formData.get('metadataJson')));
    } catch {
      return fail(400, { error: 'metadataJson must be a JSON object' });
    }

    await db
      .update(assets)
      .set({ areaId, name, assetType, metadata })
      .where(and(eq(assets.organizationId, locals.organizationId), eq(assets.id, id)));

    return { ok: true };
  },

  deleteAsset: async ({ request, locals }) => {
    const id = normalizeNullable((await request.formData()).get('id'));
    if (!id) {
      return fail(400, { error: 'Invalid asset id' });
    }

    await db
      .delete(assets)
      .where(and(eq(assets.organizationId, locals.organizationId), eq(assets.id, id)));

    return { ok: true };
  },

  createTeam: async ({ request, locals }) => {
    const formData = await request.formData();
    const parsed = teamSchema.safeParse({
      name: formData.get('name'),
      facilityId: normalizeNullable(formData.get('facilityId')),
      shiftInfoJson: normalizeNullable(formData.get('shiftInfoJson'))
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    let shiftInfo: Record<string, unknown> = {};
    try {
      shiftInfo = parseJsonObject(parsed.data.shiftInfoJson);
    } catch {
      return fail(400, { error: 'shiftInfoJson must be a JSON object' });
    }

    await db.insert(teams).values({
      organizationId: locals.organizationId,
      name: parsed.data.name,
      facilityId: parsed.data.facilityId ?? null,
      shiftInfo
    });

    return { ok: true };
  },

  updateTeam: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = normalizeNullable(formData.get('id'));
    const parsed = teamSchema.safeParse({
      name: formData.get('name'),
      facilityId: normalizeNullable(formData.get('facilityId')),
      shiftInfoJson: normalizeNullable(formData.get('shiftInfoJson'))
    });

    if (!id || !parsed.success) {
      return fail(400, { error: parsed.success ? 'Invalid team id' : parsed.error.flatten() });
    }

    let shiftInfo: Record<string, unknown> = {};
    try {
      shiftInfo = parseJsonObject(parsed.data.shiftInfoJson);
    } catch {
      return fail(400, { error: 'shiftInfoJson must be a JSON object' });
    }

    await db
      .update(teams)
      .set({
        name: parsed.data.name,
        facilityId: parsed.data.facilityId ?? null,
        shiftInfo
      })
      .where(and(eq(teams.organizationId, locals.organizationId), eq(teams.id, id)));

    return { ok: true };
  },

  deleteTeam: async ({ request, locals }) => {
    const id = normalizeNullable((await request.formData()).get('id'));
    if (!id) {
      return fail(400, { error: 'Invalid team id' });
    }

    await db.delete(teams).where(and(eq(teams.organizationId, locals.organizationId), eq(teams.id, id)));

    return { ok: true };
  },

  setTeamMembers: async ({ request, locals }) => {
    const formData = await request.formData();
    const teamId = normalizeNullable(formData.get('teamId'));
    if (!teamId) {
      return fail(400, { error: 'Invalid team id' });
    }

    const memberIds = formData
      .getAll('memberIds')
      .filter((value): value is string => typeof value === 'string' && value.length > 0);

    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.organizationId, locals.organizationId), eq(teamMembers.teamId, teamId)));

    if (memberIds.length > 0) {
      await db.insert(teamMembers).values(
        memberIds.map((memberId) => ({
          organizationId: locals.organizationId,
          teamId,
          memberId
        }))
      );
    }

    return { ok: true };
  },

  createRoutingPolicy: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = normalizeNullable(formData.get('name'));
    if (!name) {
      return fail(400, { error: 'Routing policy name is required' });
    }

    let conditions: Record<string, unknown> = {};
    let steps: unknown[] = [];

    try {
      conditions = parseJsonObject(normalizeNullable(formData.get('conditionsJson')));
      const parsedSteps: unknown = JSON.parse(normalizeNullable(formData.get('stepsJson')) ?? '[]');
      if (!Array.isArray(parsedSteps)) {
        return fail(400, { error: 'stepsJson must be an array' });
      }
      steps = parsedSteps;
    } catch {
      return fail(400, { error: 'Invalid routing JSON payload' });
    }

    await createRoutingPolicy({
      organizationId: locals.organizationId,
      name,
      facilityId: normalizeNullable(formData.get('facilityId')),
      isActive: normalizeNullable(formData.get('isActive')) !== 'false',
      conditions,
      steps
    });

    return { ok: true };
  },

  updateRoutingPolicy: async ({ request, locals }) => {
    const formData = await request.formData();
    const policyId = normalizeNullable(formData.get('policyId'));
    const name = normalizeNullable(formData.get('name'));
    if (!policyId || !name) {
      return fail(400, { error: 'Routing policy id and name are required' });
    }

    let conditions: Record<string, unknown> = {};
    let steps: unknown[] = [];

    try {
      conditions = parseJsonObject(normalizeNullable(formData.get('conditionsJson')));
      const parsedSteps: unknown = JSON.parse(normalizeNullable(formData.get('stepsJson')) ?? '[]');
      if (!Array.isArray(parsedSteps)) {
        return fail(400, { error: 'stepsJson must be an array' });
      }
      steps = parsedSteps;
    } catch {
      return fail(400, { error: 'Invalid routing JSON payload' });
    }

    await updateRoutingPolicy({
      organizationId: locals.organizationId,
      policyId,
      name,
      facilityId: normalizeNullable(formData.get('facilityId')),
      isActive: normalizeNullable(formData.get('isActive')) !== 'false',
      conditions,
      steps
    });

    return { ok: true };
  },

  deleteRoutingPolicy: async ({ request, locals }) => {
    const policyId = normalizeNullable((await request.formData()).get('policyId'));
    if (!policyId) {
      return fail(400, { error: 'Routing policy id is required' });
    }

    await deleteRoutingPolicy({
      organizationId: locals.organizationId,
      policyId
    });

    return { ok: true };
  },

  reorderRoutingPolicies: async ({ request, locals }) => {
    const order = normalizeNullable((await request.formData()).get('orderedPolicyIds'));
    if (!order) {
      return fail(400, { error: 'orderedPolicyIds is required' });
    }

    const orderedPolicyIds = order
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    await reorderRoutingPolicies({
      organizationId: locals.organizationId,
      orderedPolicyIds
    });

    return { ok: true };
  }
};
