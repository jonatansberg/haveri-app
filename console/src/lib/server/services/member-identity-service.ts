import { and, eq } from 'drizzle-orm';
import { db, withTransaction } from '$lib/server/db/client';
import { memberChatIdentities, members } from '$lib/server/db/schema';

function normalizePlatformTenantId(platformTenantId?: string | null): string {
  return platformTenantId?.trim() ?? '';
}

function normalizeDisplayName(displayName?: string | null): string {
  return displayName?.trim() ?? '';
}

export async function resolveMemberByPlatformIdentity(input: {
  organizationId: string;
  platform: string;
  platformUserId: string;
  platformTenantId?: string | null;
}): Promise<{ memberId: string; name: string } | null> {
  const platformTenantId = normalizePlatformTenantId(input.platformTenantId);

  const row = await db
    .select({
      memberId: memberChatIdentities.memberId,
      name: members.name
    })
    .from(memberChatIdentities)
    .innerJoin(members, eq(members.id, memberChatIdentities.memberId))
    .where(
      and(
        eq(memberChatIdentities.organizationId, input.organizationId),
        eq(memberChatIdentities.platform, input.platform),
        eq(memberChatIdentities.platformTenantId, platformTenantId),
        eq(memberChatIdentities.platformUserId, input.platformUserId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!row) {
    return null;
  }

  return {
    memberId: row.memberId,
    name: row.name
  };
}

export async function resolveMemberByNameHint(input: {
  organizationId: string;
  nameHint: string;
}): Promise<{ memberId: string; name: string } | null> {
  const row = await db
    .select({ memberId: members.id, name: members.name })
    .from(members)
    .where(and(eq(members.organizationId, input.organizationId), eq(members.name, input.nameHint)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!row) {
    return null;
  }

  return row;
}

export async function resolveOrProvisionMemberByPlatformIdentity(input: {
  organizationId: string;
  platform: string;
  platformUserId: string;
  platformTenantId?: string | null;
  displayName?: string | null;
}): Promise<{ memberId: string; name: string; wasProvisioned: boolean } | null> {
  const platformTenantId = normalizePlatformTenantId(input.platformTenantId);
  const existing = await resolveMemberByPlatformIdentity({
    organizationId: input.organizationId,
    platform: input.platform,
    platformUserId: input.platformUserId,
    platformTenantId
  });

  if (existing) {
    return {
      ...existing,
      wasProvisioned: false
    };
  }

  const name = normalizeDisplayName(input.displayName);
  if (!name) {
    return null;
  }

  return withTransaction(async (tx) => {
    const current = await tx
      .select({
        memberId: memberChatIdentities.memberId,
        name: members.name
      })
      .from(memberChatIdentities)
      .innerJoin(members, eq(members.id, memberChatIdentities.memberId))
      .where(
        and(
          eq(memberChatIdentities.organizationId, input.organizationId),
          eq(memberChatIdentities.platform, input.platform),
          eq(memberChatIdentities.platformTenantId, platformTenantId),
          eq(memberChatIdentities.platformUserId, input.platformUserId)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (current) {
      return {
        memberId: current.memberId,
        name: current.name,
        wasProvisioned: false
      };
    }

    const insertedMember = await tx
      .insert(members)
      .values({
        organizationId: input.organizationId,
        name,
        role: 'operator'
      })
      .returning({ id: members.id, name: members.name })
      .then((rows) => rows[0]);

    if (!insertedMember) {
      return null;
    }

    const insertedIdentity = await tx
      .insert(memberChatIdentities)
      .values({
        organizationId: input.organizationId,
        memberId: insertedMember.id,
        platform: input.platform,
        platformTenantId,
        platformUserId: input.platformUserId,
        displayName: name
      })
      .onConflictDoNothing({
        target: [
          memberChatIdentities.organizationId,
          memberChatIdentities.platform,
          memberChatIdentities.platformTenantId,
          memberChatIdentities.platformUserId
        ]
      })
      .returning({ id: memberChatIdentities.id })
      .then((rows) => rows[0]);

    if (!insertedIdentity) {
      const winner = await tx
        .select({
          memberId: memberChatIdentities.memberId,
          name: members.name
        })
        .from(memberChatIdentities)
        .innerJoin(members, eq(members.id, memberChatIdentities.memberId))
        .where(
          and(
            eq(memberChatIdentities.organizationId, input.organizationId),
            eq(memberChatIdentities.platform, input.platform),
            eq(memberChatIdentities.platformTenantId, platformTenantId),
            eq(memberChatIdentities.platformUserId, input.platformUserId)
          )
        )
        .limit(1)
        .then((rows) => rows[0]);

      if (winner) {
        return {
          memberId: winner.memberId,
          name: winner.name,
          wasProvisioned: false
        };
      }

      return null;
    }

    return {
      memberId: insertedMember.id,
      name: insertedMember.name,
      wasProvisioned: true
    };
  });
}
