import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireUser = vi.hoisted(() => vi.fn());
const mockGetOrganizationId = vi.hoisted(() => vi.fn());
const mockToErrorResponse = vi.hoisted(() => vi.fn());
const mockGetIncidentAttachmentBinary = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/auth-utils', () => ({
  requireUser: mockRequireUser,
  getOrganizationId: mockGetOrganizationId
}));

vi.mock('$lib/server/api/http', () => ({
  toErrorResponse: mockToErrorResponse
}));

vi.mock('$lib/server/services/incident-attachment-service', () => ({
  getIncidentAttachmentBinary: mockGetIncidentAttachmentBinary
}));

import { GET } from '../../routes/api/incidents/[id]/attachments/[attachmentId]/+server';

describe('GET /api/incidents/[id]/attachments/[attachmentId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockReturnValue({ id: 'user-1' });
    mockGetOrganizationId.mockReturnValue('org-1');
    mockToErrorResponse.mockImplementation(() => new Response('error', { status: 500 }));
  });

  it('returns attachment binary with scoped org lookup', async () => {
    mockGetIncidentAttachmentBinary.mockResolvedValue({
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
      body: Buffer.from('jpeg-data')
    });

    const response = await GET({
      params: { id: 'inc-1', attachmentId: 'att-1' },
      request: new Request('http://localhost/api/incidents/inc-1/attachments/att-1'),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(response.headers.get('content-disposition')).toContain('photo.jpg');
    expect(mockGetIncidentAttachmentBinary).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1',
      attachmentId: 'att-1'
    });
    await expect(response.text()).resolves.toBe('jpeg-data');
  });

  it('uses shared error mapping for failures', async () => {
    mockGetIncidentAttachmentBinary.mockRejectedValue(new Error('nope'));

    const response = await GET({
      params: { id: 'inc-1', attachmentId: 'att-2' },
      request: new Request('http://localhost/api/incidents/inc-1/attachments/att-2'),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof GET>[0]);

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe('error');
  });
});
