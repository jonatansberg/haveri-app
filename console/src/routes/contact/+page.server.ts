import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { createContactSubmission } from '$lib/server/services/marketing-lead-service';
import type { Actions } from './$types';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(1),
  role: z.string().min(1),
  teamSize: z.string().min(1),
  message: z.string().min(10)
});

export const actions: Actions = {
  submit: async ({ request }) => {
    const formData = await request.formData();
    const parsed = contactSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      company: formData.get('company'),
      role: formData.get('role'),
      teamSize: formData.get('teamSize'),
      message: formData.get('message')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.flatten() });
    }

    await createContactSubmission(parsed.data);
    return { ok: true, submitted: true };
  }
};
