import { and, eq } from 'drizzle-orm';
import { db, pool } from './client';
import {
  escalationPolicies,
  escalationPolicySteps,
  facilities,
  members,
  organizationChatSettings,
  organizations,
  teams
} from './schema';

const defaultOrgId = process.env['DEFAULT_ORG_ID'] ?? '00000000-0000-0000-0000-000000000001';

async function seed(): Promise<void> {
  await db
    .insert(organizations)
    .values({ id: defaultOrgId, name: 'Acme Manufacturing' })
    .onConflictDoNothing({ target: organizations.id });

  await db
    .insert(facilities)
    .values({ organizationId: defaultOrgId, name: 'Plant North', timezone: 'America/Chicago' })
    .onConflictDoNothing({ target: [facilities.organizationId, facilities.name] });

  const facility = await db
    .select({ id: facilities.id })
    .from(facilities)
    .where(and(eq(facilities.organizationId, defaultOrgId), eq(facilities.name, 'Plant North')))
    .limit(1)
    .then((rows) => rows[0]);

  if (!facility) {
    throw new Error('Failed to fetch seeded facility');
  }

  await db
    .insert(teams)
    .values({ organizationId: defaultOrgId, name: 'Shift A', facilityId: facility.id })
    .onConflictDoNothing({ target: [teams.organizationId, teams.name] });

  const team = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.organizationId, defaultOrgId), eq(teams.name, 'Shift A')))
    .limit(1)
    .then((rows) => rows[0]);

  if (!team) {
    throw new Error('Failed to fetch seeded team');
  }

  const existingMember = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.organizationId, defaultOrgId), eq(members.name, 'Alex Rivera')))
    .limit(1);

  if (!existingMember.length) {
    await db.insert(members).values({
      organizationId: defaultOrgId,
      teamId: team.id,
      name: 'Alex Rivera',
      role: 'supervisor'
    });
  }

  await db
    .insert(organizationChatSettings)
    .values({
      organizationId: defaultOrgId,
      platform: 'teams',
      globalIncidentChannelRef: process.env['TEAMS_GLOBAL_INCIDENT_CHANNEL'] ?? 'haveri-incidents',
      autoCreateIncidentChannel: true
    })
    .onConflictDoUpdate({
      target: [organizationChatSettings.organizationId, organizationChatSettings.platform],
      set: {
        globalIncidentChannelRef: process.env['TEAMS_GLOBAL_INCIDENT_CHANNEL'] ?? 'haveri-incidents',
        autoCreateIncidentChannel: true,
        updatedAt: new Date().toISOString()
      }
    });

  await db
    .insert(escalationPolicies)
    .values({
      organizationId: defaultOrgId,
      facilityId: facility.id,
      name: 'Default Escalation',
      conditions: { severity: ['SEV1', 'SEV2', 'SEV3'] },
      isActive: true
    })
    .onConflictDoNothing({ target: [escalationPolicies.organizationId, escalationPolicies.name] });

  const policy = await db
    .select({ id: escalationPolicies.id })
    .from(escalationPolicies)
    .where(
      and(
        eq(escalationPolicies.organizationId, defaultOrgId),
        eq(escalationPolicies.name, 'Default Escalation')
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!policy) {
    throw new Error('Failed to fetch seeded policy');
  }

  const steps = [
    { stepOrder: 1, delayMinutes: 0, notifyType: 'team', ifUnacked: false },
    { stepOrder: 2, delayMinutes: 15, notifyType: 'supervisor', ifUnacked: true },
    { stepOrder: 3, delayMinutes: 30, notifyType: 'manager', ifUnacked: true }
  ];

  for (const step of steps) {
    await db
      .insert(escalationPolicySteps)
      .values({
        policyId: policy.id,
        organizationId: defaultOrgId,
        stepOrder: step.stepOrder,
        delayMinutes: step.delayMinutes,
        notifyType: step.notifyType,
        notifyTargetIds: [],
        ifUnacked: step.ifUnacked
      })
      .onConflictDoNothing({ target: [escalationPolicySteps.policyId, escalationPolicySteps.stepOrder] });
  }

  console.log('Seed complete');
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
