import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { incidentAttachments } from '$lib/server/db/schema';
import {
  buildIncidentBlobStoragePath,
  readStoredBlob,
  storeRemoteBlob
} from '$lib/server/services/blob-storage';
import { NotFoundError } from '$lib/server/services/errors';

export interface IncomingAttachment {
  name: string | null;
  contentType: string | null;
  contentUrl: string | null;
}

export interface StoredIncidentAttachment {
  attachmentId: string;
  name: string;
  contentType: string | null;
  contentUrl: string;
  storagePath: string;
  byteSize: number | null;
  sourceContentUrl: string;
}

export async function persistIncidentAttachments(input: {
  organizationId: string;
  incidentId: string;
  sourcePlatform: string;
  sourceEventId: string;
  attachments: IncomingAttachment[];
}): Promise<StoredIncidentAttachment[]> {
  const stored: StoredIncidentAttachment[] = [];

  for (const [index, attachment] of input.attachments.entries()) {
    if (!attachment.contentUrl) {
      continue;
    }

    const pathInfo = buildIncidentBlobStoragePath({
      organizationId: input.organizationId,
      incidentId: input.incidentId,
      fileName: attachment.name,
      fallbackIndex: index
    });

    const blob = await storeRemoteBlob({
      storagePath: pathInfo.storagePath,
      contentUrl: attachment.contentUrl,
      declaredContentType: attachment.contentType
    });

    const [created] = await db
      .insert(incidentAttachments)
      .values({
        organizationId: input.organizationId,
        incidentId: input.incidentId,
        sourcePlatform: input.sourcePlatform,
        sourceEventId: input.sourceEventId,
        sourceContentUrl: attachment.contentUrl,
        storagePath: pathInfo.storagePath,
        fileName: pathInfo.fileName,
        contentType: blob.contentType,
        byteSize: blob.byteSize
      })
      .returning({ id: incidentAttachments.id });

    if (!created) {
      continue;
    }

    stored.push({
      attachmentId: created.id,
      name: pathInfo.fileName,
      contentType: blob.contentType,
      contentUrl: `/api/incidents/${input.incidentId}/attachments/${created.id}`,
      storagePath: pathInfo.storagePath,
      byteSize: blob.byteSize,
      sourceContentUrl: attachment.contentUrl
    });
  }

  return stored;
}

export async function getIncidentAttachmentBinary(input: {
  organizationId: string;
  incidentId: string;
  attachmentId: string;
}): Promise<{ fileName: string; contentType: string | null; body: Buffer }> {
  const row = await db
    .select({
      fileName: incidentAttachments.fileName,
      contentType: incidentAttachments.contentType,
      storagePath: incidentAttachments.storagePath
    })
    .from(incidentAttachments)
    .where(
      and(
        eq(incidentAttachments.organizationId, input.organizationId),
        eq(incidentAttachments.incidentId, input.incidentId),
        eq(incidentAttachments.id, input.attachmentId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!row) {
    throw new NotFoundError(`Attachment ${input.attachmentId} not found`);
  }

  const body = await readStoredBlob(row.storagePath);

  return {
    fileName: row.fileName,
    contentType: row.contentType,
    body
  };
}
