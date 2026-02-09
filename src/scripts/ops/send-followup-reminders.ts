import { asc } from 'drizzle-orm';
import { db, pool } from '$lib/server/db/client';
import { organizations } from '$lib/server/db/schema';
import { sendFollowUpReminders } from '$lib/server/services/follow-up-notification-service';

async function run(): Promise<void> {
  const requestedOrgId = process.env['ORG_ID'] ?? null;

  const orgIds = requestedOrgId
    ? [requestedOrgId]
    : await db
        .select({ id: organizations.id })
        .from(organizations)
        .orderBy(asc(organizations.createdAt))
        .then((rows) => rows.map((row) => row.id));

  let totalSent = 0;

  for (const organizationId of orgIds) {
    const result = await sendFollowUpReminders({ organizationId });
    totalSent += result.sent;
    console.log(`follow-up reminders: org=${organizationId} sent=${result.sent}`);
  }

  console.log(`follow-up reminders complete: totalSent=${totalSent}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
