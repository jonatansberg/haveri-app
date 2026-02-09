import { toErrorResponse } from '$lib/server/api/http';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import { getIncidentAttachmentBinary } from '$lib/server/services/incident-attachment-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  try {
    requireUser(event);
    const organizationId = getOrganizationId(event);

    const attachment = await getIncidentAttachmentBinary({
      organizationId,
      incidentId: event.params.id,
      attachmentId: event.params.attachmentId
    });

    return new Response(new Uint8Array(attachment.body), {
      status: 200,
      headers: {
        'content-type': attachment.contentType ?? 'application/octet-stream',
        'content-disposition': `inline; filename="${attachment.fileName}"`,
        'cache-control': 'private, max-age=60'
      }
    });
  } catch (error) {
    return toErrorResponse(error);
  }
};
