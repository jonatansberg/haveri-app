import { asc, eq } from 'drizzle-orm';
import { db, withTransaction } from '$lib/server/db/client';
import { organizationMemberships, organizations } from '$lib/server/db/schema';

interface OrganizationMembershipContext {
  organizationId: string;
  organizationSlug: string;
}

async function listMembershipsForUser(userId: string): Promise<OrganizationMembershipContext[]> {
  return db
    .select({
      organizationId: organizations.id,
      organizationSlug: organizations.slug
    })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
    .where(eq(organizationMemberships.userId, userId))
    .orderBy(asc(organizationMemberships.createdAt));
}

function pickOrganizationContext(
  memberships: OrganizationMembershipContext[],
  input: {
    requestedOrganizationId?: string | null;
    requestedOrganizationSlug?: string | null;
  }
): OrganizationMembershipContext | null {
  if (memberships.length === 0) {
    return null;
  }

  const requestedOrganizationId = input.requestedOrganizationId?.trim() ?? '';
  const requestedOrganizationSlug = input.requestedOrganizationSlug?.trim() ?? '';

  if (requestedOrganizationId) {
    return memberships.find((membership) => membership.organizationId === requestedOrganizationId) ?? null;
  }

  if (requestedOrganizationSlug) {
    return (
      memberships.find((membership) => membership.organizationSlug === requestedOrganizationSlug) ?? null
    );
  }

  return memberships[0] ?? null;
}

export async function resolveOrganizationContextForUser(input: {
  userId: string;
  fallbackOrganizationId: string;
  requestedOrganizationId?: string | null;
  requestedOrganizationSlug?: string | null;
}): Promise<OrganizationMembershipContext | null> {
  let memberships = await listMembershipsForUser(input.userId);
  if (memberships.length === 0) {
    await withTransaction(async (tx) => {
      await tx
        .insert(organizationMemberships)
        .values({
          organizationId: input.fallbackOrganizationId,
          userId: input.userId,
          role: 'member'
        })
        .onConflictDoNothing({
          target: [organizationMemberships.organizationId, organizationMemberships.userId]
        });
    });

    memberships = await listMembershipsForUser(input.userId);
  }

  return pickOrganizationContext(memberships, {
    ...(input.requestedOrganizationId ? { requestedOrganizationId: input.requestedOrganizationId } : {}),
    ...(input.requestedOrganizationSlug
      ? { requestedOrganizationSlug: input.requestedOrganizationSlug }
      : {})
  });
}
