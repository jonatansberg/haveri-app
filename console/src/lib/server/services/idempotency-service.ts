import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { inboundIdempotency } from '$lib/server/db/schema';

export async function getIdempotentResponse(
  organizationId: string,
  platform: string,
  idempotencyKey: string
): Promise<Record<string, unknown> | null> {
  const row = await db
    .select({ responsePayload: inboundIdempotency.responsePayload })
    .from(inboundIdempotency)
    .where(
      and(
        eq(inboundIdempotency.organizationId, organizationId),
        eq(inboundIdempotency.platform, platform),
        eq(inboundIdempotency.idempotencyKey, idempotencyKey)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  return row?.responsePayload ?? null;
}

export async function storeIdempotentResponse(input: {
  organizationId: string;
  platform: string;
  idempotencyKey: string;
  responsePayload: Record<string, unknown>;
}): Promise<void> {
  await db
    .insert(inboundIdempotency)
    .values({
      organizationId: input.organizationId,
      platform: input.platform,
      idempotencyKey: input.idempotencyKey,
      responsePayload: input.responsePayload
    })
    .onConflictDoNothing({
      target: [
        inboundIdempotency.organizationId,
        inboundIdempotency.platform,
        inboundIdempotency.idempotencyKey
      ]
    });
}
