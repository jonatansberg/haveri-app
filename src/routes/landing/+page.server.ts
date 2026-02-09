import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { createEmailCapture } from '$lib/server/services/marketing-lead-service';
import type { Actions, PageServerLoad } from './$types';

const emailCaptureSchema = z.object({
  email: z.string().email()
});

export const load: PageServerLoad = async () => ({
  title: 'Haveri'
});

export const actions: Actions = {
  captureEmail: async ({ request }) => {
    const formData = await request.formData();
    const parsed = emailCaptureSchema.safeParse({
      email: formData.get('email')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    await createEmailCapture({ email: parsed.data.email });
    return { ok: true, captured: true };
  }
};
