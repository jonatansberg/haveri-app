import type { PoolClient } from 'pg';
import type { IncidentSeverity, IncidentStatus } from '$lib/shared/domain';
import type { IncidentEvent } from '$lib/shared/domain';
import { NotFoundError } from './errors';

interface CurrentStateRow {
  incident_id: string;
  organization_id: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  assigned_to_member_id: string | null;
  last_event_sequence: number;
}

interface ProjectionPatch {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  assignedToMemberId?: string | null;
}

export async function lockIncidentCurrentState(
  client: PoolClient,
  organizationId: string,
  incidentId: string
): Promise<CurrentStateRow> {
  const current = await client.query<CurrentStateRow>(
    `
    SELECT incident_id, organization_id, status, severity, assigned_to_member_id, last_event_sequence
    FROM incident_current_state
    WHERE organization_id = $1 AND incident_id = $2
    FOR UPDATE
    `,
    [organizationId, incidentId]
  );

  if (!current.rowCount) {
    throw new NotFoundError(`Incident ${incidentId} not found`);
  }

  const row = current.rows[0];
  if (!row) {
    throw new NotFoundError(`Incident ${incidentId} not found`);
  }
  return row;
}

export async function appendIncidentEvent(
  client: PoolClient,
  event: IncidentEvent,
  patch: ProjectionPatch = {}
): Promise<number> {
  const current = await lockIncidentCurrentState(client, event.organizationId, event.incidentId);
  const nextSequence = current.last_event_sequence + 1;

  await client.query(
    `
    INSERT INTO incident_events(
      organization_id,
      incident_id,
      sequence,
      event_type,
      event_version,
      schema_version,
      actor_type,
      actor_member_id,
      actor_external_id,
      source_platform,
      source_event_id,
      payload,
      raw_source_payload
    )
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb)
    `,
    [
      event.organizationId,
      event.incidentId,
      nextSequence,
      event.eventType,
      event.eventVersion,
      event.schemaVersion,
      event.actorType,
      event.actorMemberId ?? null,
      event.actorExternalId ?? null,
      event.sourcePlatform ?? null,
      event.sourceEventId ?? null,
      JSON.stringify(event.payload),
      JSON.stringify(event.rawSourcePayload ?? null)
    ]
  );

  await client.query(
    `
    UPDATE incident_current_state
    SET
      status = COALESCE($3, status),
      severity = COALESCE($4, severity),
      assigned_to_member_id = CASE WHEN $5::boolean THEN $6 ELSE assigned_to_member_id END,
      last_event_sequence = $7,
      updated_at = NOW()
    WHERE organization_id = $1 AND incident_id = $2
    `,
    [
      event.organizationId,
      event.incidentId,
      patch.status ?? null,
      patch.severity ?? null,
      Object.prototype.hasOwnProperty.call(patch, 'assignedToMemberId'),
      patch.assignedToMemberId ?? null,
      nextSequence
    ]
  );

  return nextSequence;
}

export async function insertInitialIncidentEvent(
  client: PoolClient,
  event: IncidentEvent,
  initial: {
    status: IncidentStatus;
    severity: IncidentSeverity;
    assignedToMemberId?: string | null;
  }
): Promise<void> {
  await client.query(
    `
    INSERT INTO incident_events(
      organization_id,
      incident_id,
      sequence,
      event_type,
      event_version,
      schema_version,
      actor_type,
      actor_member_id,
      actor_external_id,
      source_platform,
      source_event_id,
      payload,
      raw_source_payload
    )
    VALUES($1,$2,1,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb)
    `,
    [
      event.organizationId,
      event.incidentId,
      event.eventType,
      event.eventVersion,
      event.schemaVersion,
      event.actorType,
      event.actorMemberId ?? null,
      event.actorExternalId ?? null,
      event.sourcePlatform ?? null,
      event.sourceEventId ?? null,
      JSON.stringify(event.payload),
      JSON.stringify(event.rawSourcePayload ?? null)
    ]
  );

  await client.query(
    `
    INSERT INTO incident_current_state(
      incident_id,
      organization_id,
      status,
      severity,
      assigned_to_member_id,
      last_event_sequence
    )
    VALUES($1,$2,$3,$4,$5,1)
    `,
    [
      event.incidentId,
      event.organizationId,
      initial.status,
      initial.severity,
      initial.assignedToMemberId ?? null
    ]
  );
}
