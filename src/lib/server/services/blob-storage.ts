import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getBlobStorageRoot } from '$lib/server/services/env';
import { ValidationError } from '$lib/server/services/errors';

function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function resolveLocalBlobPath(storagePath: string): string {
  const root = path.resolve(getBlobStorageRoot());
  const resolved = path.resolve(root, storagePath);

  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new ValidationError('Invalid blob path');
  }

  return resolved;
}

function inferFileName(input: { name: string | null; contentUrl: string | null; fallbackIndex: number }): string {
  if (input.name) {
    const cleaned = sanitizePathSegment(input.name);
    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  if (input.contentUrl) {
    try {
      const parsed = new URL(input.contentUrl);
      const fromPath = parsed.pathname.split('/').pop();
      if (fromPath) {
        const cleaned = sanitizePathSegment(fromPath);
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    } catch {
      // ignore malformed URL and fallback
    }
  }

  return `attachment-${input.fallbackIndex + 1}.bin`;
}

export function buildIncidentBlobStoragePath(input: {
  organizationId: string;
  incidentId: string;
  fileName: string | null;
  fallbackIndex: number;
}): { storagePath: string; fileName: string } {
  const fileName = inferFileName({
    name: input.fileName,
    contentUrl: null,
    fallbackIndex: input.fallbackIndex
  });

  const pathPrefix = `${input.organizationId}/incidents/${input.incidentId}`;
  return {
    storagePath: `${pathPrefix}/${randomUUID()}-${fileName}`,
    fileName
  };
}

export async function storeRemoteBlob(input: {
  storagePath: string;
  contentUrl: string;
  declaredContentType: string | null;
}): Promise<{ byteSize: number; contentType: string | null }> {
  const response = await fetch(input.contentUrl);
  if (!response.ok) {
    throw new ValidationError(`Failed to fetch attachment (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get('content-type') ?? input.declaredContentType;

  const absolutePath = resolveLocalBlobPath(input.storagePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return {
    byteSize: buffer.byteLength,
    contentType
  };
}

export async function readStoredBlob(storagePath: string): Promise<Buffer> {
  const absolutePath = resolveLocalBlobPath(storagePath);
  return fs.readFile(absolutePath);
}
