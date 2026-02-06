import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { memberChatIdentities, members } from '$lib/server/db/schema';

export async function resolveMemberByPlatformIdentity(input: {
  organizationId: string;
  platform: string;
  platformUserId: string;
}): Promise<{ memberId: string; name: string } | null> {
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
