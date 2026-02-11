import { Client } from 'pg';
import { readEnvVar } from './env';
import { allTenantFixtures, type TenantFixture } from './tenants';

interface SeedOptions {
  runId: string;
}

interface SeedRuntime {
  runId: string;
  email: string | null;
}

function buildClient(): Client {
  return new Client({
    connectionString: readEnvVar('DATABASE_URL')
  });
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = buildClient();
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function upsertTenantBaseData(client: Client, tenant: TenantFixture): Promise<void> {
  await client.query(
    `
      INSERT INTO organizations (id, name, slug)
      VALUES ($1::uuid, $2::text, $3::text)
      ON CONFLICT (id)
      DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug
    `,
    [tenant.organizationId, tenant.name, tenant.slug]
  );

  await client.query(
    `
      INSERT INTO facilities (id, organization_id, name, timezone, metadata)
      VALUES ($1::uuid, $2::uuid, $3::text, $4::text, '{}'::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        name = EXCLUDED.name,
        timezone = EXCLUDED.timezone,
        metadata = EXCLUDED.metadata
    `,
    [tenant.facilityId, tenant.organizationId, tenant.facilityName, 'Europe/Stockholm']
  );

  await client.query(
    `
      INSERT INTO areas (id, organization_id, facility_id, name, description)
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4::text, $5::text)
      ON CONFLICT (id)
      DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        facility_id = EXCLUDED.facility_id,
        name = EXCLUDED.name,
        description = EXCLUDED.description
    `,
    [tenant.areaId, tenant.organizationId, tenant.facilityId, tenant.areaName, `${tenant.areaName} desc`]
  );

  await client.query(
    `
      INSERT INTO assets (id, organization_id, area_id, name, asset_type, metadata)
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4::text, $5::text, '{}'::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        area_id = EXCLUDED.area_id,
        name = EXCLUDED.name,
        asset_type = EXCLUDED.asset_type,
        metadata = EXCLUDED.metadata
    `,
    [tenant.assetId, tenant.organizationId, tenant.areaId, tenant.assetName, 'pump']
  );

  await client.query(
    `
      INSERT INTO members (id, organization_id, name, role, contact_prefs)
      VALUES
        ($1::uuid, $2::uuid, $3::text, 'supervisor', '{}'::jsonb),
        ($4::uuid, $2::uuid, $5::text, 'comms', '{}'::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        contact_prefs = EXCLUDED.contact_prefs
    `,
    [
      tenant.memberLeadId,
      tenant.organizationId,
      tenant.memberLeadName,
      tenant.memberCommsId,
      tenant.memberCommsName
    ]
  );

  const teamId = `${tenant.organizationId.slice(0, 35)}9`;
  await client.query(
    `
      INSERT INTO teams (id, organization_id, facility_id, name, shift_info)
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4::text, '{}'::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        facility_id = EXCLUDED.facility_id,
        name = EXCLUDED.name,
        shift_info = EXCLUDED.shift_info
    `,
    [teamId, tenant.organizationId, tenant.facilityId, `${tenant.name} Team`]
  );

  await client.query(
    `
      INSERT INTO team_members (team_id, member_id, organization_id)
      VALUES
        ($1::uuid, $2::uuid, $4::uuid),
        ($1::uuid, $3::uuid, $4::uuid)
      ON CONFLICT (team_id, member_id) DO NOTHING
    `,
    [teamId, tenant.memberLeadId, tenant.memberCommsId, tenant.organizationId]
  );

  await client.query(
    `
      INSERT INTO organization_chat_settings (
        organization_id,
        platform,
        global_incident_channel_ref,
        auto_create_incident_channel,
        auto_archive_on_close
      )
      VALUES ($1::uuid, 'teams', $2::text, true, false)
      ON CONFLICT (organization_id, platform)
      DO UPDATE SET
        global_incident_channel_ref = EXCLUDED.global_incident_channel_ref,
        auto_create_incident_channel = EXCLUDED.auto_create_incident_channel,
        auto_archive_on_close = EXCLUDED.auto_archive_on_close,
        updated_at = now()
    `,
    [tenant.organizationId, `teams|seed-team|${tenant.slug}-global`]
  );

  await client.query(
    `
      INSERT INTO incidents (
        id,
        organization_id,
        title,
        declared_by_member_id,
        facility_id,
        area_id,
        assigned_to_member_id,
        comms_lead_member_id,
        chat_platform,
        chat_channel_ref,
        global_channel_ref,
        global_message_ref,
        tags
      )
      VALUES (
        $1::uuid,
        $2::uuid,
        $3::text,
        $4::uuid,
        $5::uuid,
        $6::uuid,
        $4::uuid,
        $7::uuid,
        'teams',
        $8::text,
        $9::text,
        $10::text,
        ARRAY[]::text[]
      )
      ON CONFLICT (id)
      DO UPDATE SET
        title = EXCLUDED.title,
        declared_by_member_id = EXCLUDED.declared_by_member_id,
        facility_id = EXCLUDED.facility_id,
        area_id = EXCLUDED.area_id,
        assigned_to_member_id = EXCLUDED.assigned_to_member_id,
        comms_lead_member_id = EXCLUDED.comms_lead_member_id,
        chat_platform = EXCLUDED.chat_platform,
        chat_channel_ref = EXCLUDED.chat_channel_ref,
        global_channel_ref = EXCLUDED.global_channel_ref,
        global_message_ref = EXCLUDED.global_message_ref,
        tags = EXCLUDED.tags
    `,
    [
      tenant.incidentId,
      tenant.organizationId,
      tenant.incidentTitle,
      tenant.memberLeadId,
      tenant.facilityId,
      tenant.areaId,
      tenant.memberCommsId,
      `teams|seed-team|${tenant.slug}-incident`,
      `teams|seed-team|${tenant.slug}-global`,
      `seed-message-${tenant.key}`
    ]
  );

  await client.query(
    `
      INSERT INTO incident_assets (incident_id, asset_id, organization_id)
      VALUES ($1::uuid, $2::uuid, $3::uuid)
      ON CONFLICT (incident_id, asset_id) DO NOTHING
    `,
    [tenant.incidentId, tenant.assetId, tenant.organizationId]
  );

  await client.query(
    `
      INSERT INTO incident_current_state (
        incident_id,
        organization_id,
        status,
        severity,
        assigned_to_member_id,
        last_event_sequence
      )
      VALUES ($1::uuid, $2::uuid, 'DECLARED', 'SEV2', $3::uuid, 1)
      ON CONFLICT (incident_id)
      DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        status = EXCLUDED.status,
        severity = EXCLUDED.severity,
        assigned_to_member_id = EXCLUDED.assigned_to_member_id,
        last_event_sequence = EXCLUDED.last_event_sequence,
        updated_at = now()
    `,
    [tenant.incidentId, tenant.organizationId, tenant.memberLeadId]
  );

  await client.query(
    `
      INSERT INTO incident_events (
        organization_id,
        incident_id,
        sequence,
        event_type,
        event_version,
        schema_version,
        actor_type,
        actor_member_id,
        payload
      )
      VALUES ($1::uuid, $2::uuid, 1, 'declared', 1, 1, 'member', $3::uuid, $4::jsonb)
      ON CONFLICT (organization_id, incident_id, sequence)
      DO UPDATE SET
        event_type = EXCLUDED.event_type,
        actor_type = EXCLUDED.actor_type,
        actor_member_id = EXCLUDED.actor_member_id,
        payload = EXCLUDED.payload
    `,
    [
      tenant.organizationId,
      tenant.incidentId,
      tenant.memberLeadId,
      JSON.stringify({
        title: tenant.incidentTitle,
        severity: 'SEV2',
        facilityId: tenant.facilityId,
        areaId: tenant.areaId,
        assetIds: [tenant.assetId]
      })
    ]
  );

  await client.query(
    `
      INSERT INTO incident_escalation_runtime (incident_id, organization_id, latest_step_order)
      VALUES ($1::uuid, $2::uuid, 0)
      ON CONFLICT (incident_id)
      DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        latest_step_order = EXCLUDED.latest_step_order,
        updated_at = now()
    `,
    [tenant.incidentId, tenant.organizationId]
  );

  await client.query(
    `
      INSERT INTO follow_ups (
        organization_id,
        incident_id,
        description,
        assigned_to_member_id,
        due_date,
        status
      )
      VALUES ($1::uuid, $2::uuid, $3::text, $4::uuid, current_date - interval '1 day', 'OPEN')
      ON CONFLICT DO NOTHING
    `,
    [tenant.organizationId, tenant.incidentId, tenant.followUpDescription, tenant.memberLeadId]
  );
}

export async function seedE2eTenants(options: SeedOptions): Promise<SeedRuntime> {
  return withClient(async (client) => {
    const allTenantIds = allTenantFixtures().map((fixture) => fixture.organizationId);

    await client.query('BEGIN');
    try {
      await client.query('DELETE FROM organizations WHERE id = ANY($1::uuid[])', [allTenantIds]);

      for (const tenant of allTenantFixtures()) {
        await upsertTenantBaseData(client, tenant);
      }

      const seedRuntime: SeedRuntime = {
        runId: options.runId,
        email: null
      };

      await client.query(
        `
          INSERT INTO inbound_idempotency (organization_id, platform, idempotency_key, response_payload)
          VALUES ($1::uuid, 'e2e', $2::text, $3::jsonb)
          ON CONFLICT (organization_id, platform, idempotency_key)
          DO UPDATE SET response_payload = EXCLUDED.response_payload, handled_at = now()
        `,
        [allTenantIds[0], `seed-${options.runId}`, JSON.stringify(seedRuntime)]
      );

      await client.query('COMMIT');
      return seedRuntime;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function addMembershipsForUserEmail(email: string): Promise<void> {
  await withClient(async (client) => {
    const userResult = await client.query<{ id: string }>('SELECT id FROM auth_user WHERE email = $1 LIMIT 1', [
      email.toLowerCase()
    ]);

    const user = userResult.rows[0];
    if (!user?.id) {
      throw new Error(`Failed to resolve auth_user row for ${email}`);
    }

    for (const tenant of allTenantFixtures()) {
      await client.query(
        `
          INSERT INTO organization_memberships (organization_id, user_id, role)
          VALUES ($1::uuid, $2::text, 'member')
          ON CONFLICT (organization_id, user_id) DO NOTHING
        `,
        [tenant.organizationId, user.id]
      );
    }
  });
}
