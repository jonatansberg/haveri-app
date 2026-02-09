import { db } from '$lib/server/db/client';
import { marketingLeads } from '$lib/server/db/schema';

export async function createEmailCapture(input: { email: string }): Promise<void> {
  await db.insert(marketingLeads).values({
    leadType: 'email_capture',
    email: input.email.trim().toLowerCase()
  });
}

export async function createContactSubmission(input: {
  name: string;
  email: string;
  company?: string | null;
  role?: string | null;
  teamSize?: string | null;
  message: string;
}): Promise<void> {
  await db.insert(marketingLeads).values({
    leadType: 'contact',
    name: input.name,
    email: input.email.trim().toLowerCase(),
    company: input.company ?? null,
    role: input.role ?? null,
    teamSize: input.teamSize ?? null,
    message: input.message
  });
}
