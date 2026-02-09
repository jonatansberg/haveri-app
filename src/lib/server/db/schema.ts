import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  bigint
} from 'drizzle-orm/pg-core';

export const incidentStatusEnum = pgEnum('incident_status', [
  'DECLARED',
  'INVESTIGATING',
  'MITIGATED',
  'RESOLVED',
  'CLOSED'
]);

export const incidentSeverityEnum = pgEnum('incident_severity', ['SEV1', 'SEV2', 'SEV3']);

export const followUpStatusEnum = pgEnum('follow_up_status', ['OPEN', 'IN_PROGRESS', 'DONE']);

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
});

export const organizationChatSettings = pgTable(
  'organization_chat_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    platform: text('platform').notNull(),
    globalIncidentChannelRef: text('global_incident_channel_ref').notNull(),
    autoCreateIncidentChannel: boolean('auto_create_incident_channel').notNull().default(true),
    autoArchiveOnClose: boolean('auto_archive_on_close').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [unique().on(table.organizationId, table.platform)]
);

export const authUsers = pgTable('auth_user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
});

export const organizationMemberships = pgTable(
  'organization_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [
    unique().on(table.organizationId, table.userId),
    index('idx_organization_memberships_user').on(table.userId)
  ]
);

export const authSessions = pgTable(
  'auth_session',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    impersonatedBy: text('impersonated_by'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [index('idx_auth_session_user').on(table.userId)]
);

export const authAccounts = pgTable(
  'auth_account',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
      mode: 'string'
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
      mode: 'string'
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [
    unique().on(table.providerId, table.accountId),
    index('idx_auth_account_user').on(table.userId)
  ]
);

export const authVerifications = pgTable('auth_verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
});

export const betterAuthSchema = {
  user: authUsers,
  session: authSessions,
  account: authAccounts,
  verification: authVerifications
} as const;

export const facilities = pgTable(
  'facilities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    timezone: text('timezone').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [unique().on(table.organizationId, table.name)]
);

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    facilityId: uuid('facility_id').references(() => facilities.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    shiftInfo: jsonb('shift_info').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [unique().on(table.organizationId, table.name)]
);

export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role').notNull(),
  contactPrefs: jsonb('contact_prefs').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
});

export const teamMembers = pgTable(
  'team_members',
  {
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.memberId] }),
    index('idx_team_members_member').on(table.memberId),
    index('idx_team_members_team').on(table.teamId)
  ]
);

export const memberChatIdentities = pgTable(
  'member_chat_identities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    platform: text('platform').notNull(),
    platformTenantId: text('platform_tenant_id').notNull().default(''),
    platformUserId: text('platform_user_id').notNull(),
    displayName: text('display_name'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [
    unique().on(table.organizationId, table.platform, table.platformTenantId, table.platformUserId),
    unique().on(table.organizationId, table.memberId, table.platform)
  ]
);

export const areas = pgTable(
  'areas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    facilityId: uuid('facility_id')
      .notNull()
      .references(() => facilities.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [unique().on(table.organizationId, table.facilityId, table.name)]
);

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    areaId: uuid('area_id')
      .notNull()
      .references(() => areas.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    assetType: text('asset_type').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [unique().on(table.organizationId, table.areaId, table.name)]
);

export const incidents = pgTable(
  'incidents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    declaredByMemberId: uuid('declared_by_member_id').references(() => members.id, {
      onDelete: 'set null'
    }),
    declaredAt: timestamp('declared_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    facilityId: uuid('facility_id')
      .notNull()
      .references(() => facilities.id, { onDelete: 'restrict' }),
    areaId: uuid('area_id').references(() => areas.id, { onDelete: 'restrict' }),
    assignedToMemberId: uuid('assigned_to_member_id').references(() => members.id, {
      onDelete: 'set null'
    }),
    commsLeadMemberId: uuid('comms_lead_member_id').references(() => members.id, {
      onDelete: 'set null'
    }),
    chatPlatform: text('chat_platform').notNull(),
    chatChannelRef: text('chat_channel_ref').notNull(),
    globalChannelRef: text('global_channel_ref'),
    globalMessageRef: text('global_message_ref'),
    tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [
    unique().on(table.organizationId, table.chatPlatform, table.chatChannelRef),
    index('idx_incidents_org_declared_at').on(table.organizationId, table.declaredAt),
    index('idx_incidents_organization_id').on(table.organizationId),
    index('idx_incidents_facility_id').on(table.facilityId)
  ]
);

export const incidentAssets = pgTable(
  'incident_assets',
  {
    incidentId: uuid('incident_id')
      .notNull()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [primaryKey({ columns: [table.incidentId, table.assetId] })]
);

export const incidentEvents = pgTable(
  'incident_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    incidentId: uuid('incident_id')
      .notNull()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    sequence: bigint('sequence', { mode: 'number' }).notNull(),
    eventType: text('event_type').notNull(),
    eventVersion: integer('event_version').notNull().default(1),
    schemaVersion: integer('schema_version').notNull().default(1),
    actorType: text('actor_type').notNull(),
    actorMemberId: uuid('actor_member_id').references(() => members.id, { onDelete: 'set null' }),
    actorExternalId: text('actor_external_id'),
    sourcePlatform: text('source_platform'),
    sourceEventId: text('source_event_id'),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    rawSourcePayload: jsonb('raw_source_payload').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [
    unique().on(table.organizationId, table.incidentId, table.sequence),
    unique().on(table.organizationId, table.sourcePlatform, table.sourceEventId),
    index('idx_incident_events_incident_id').on(table.incidentId),
    index('idx_incident_events_org_incident_created').on(
      table.organizationId,
      table.incidentId,
      table.createdAt
    ),
    index('idx_incident_events_org_type_created').on(table.organizationId, table.eventType, table.createdAt)
  ]
);

export const incidentCurrentState = pgTable(
  'incident_current_state',
  {
    incidentId: uuid('incident_id')
      .notNull()
      .primaryKey()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    status: incidentStatusEnum('status').notNull(),
    severity: incidentSeverityEnum('severity').notNull(),
    assignedToMemberId: uuid('assigned_to_member_id').references(() => members.id, {
      onDelete: 'set null'
    }),
    lastEventSequence: bigint('last_event_sequence', { mode: 'number' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [
    index('idx_incident_current_state_org_status_severity').on(
      table.organizationId,
      table.status,
      table.severity
    ),
    index('idx_incident_current_state_organization_status').on(table.organizationId, table.status)
  ]
);

export const incidentSummaries = pgTable('incident_summaries', {
  incidentId: uuid('incident_id')
    .notNull()
    .primaryKey()
    .references(() => incidents.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  whatHappened: text('what_happened').notNull().default(''),
  rootCause: text('root_cause').notNull().default(''),
  resolution: text('resolution').notNull().default(''),
  impact: jsonb('impact').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  aiSummary: text('ai_summary'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
});

export const followUps = pgTable(
  'follow_ups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    incidentId: uuid('incident_id')
      .notNull()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    assignedToMemberId: uuid('assigned_to_member_id').references(() => members.id, {
      onDelete: 'set null'
    }),
    dueDate: date('due_date', { mode: 'string' }),
    status: followUpStatusEnum('status').notNull().default('OPEN'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [index('idx_follow_ups_org_status_due').on(table.organizationId, table.status, table.dueDate)]
);

export const escalationPolicies = pgTable(
  'escalation_policies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    facilityId: uuid('facility_id').references(() => facilities.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    conditions: jsonb('conditions').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [unique().on(table.organizationId, table.name)]
);

export const escalationPolicySteps = pgTable(
  'escalation_policy_steps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    policyId: uuid('policy_id')
      .notNull()
      .references(() => escalationPolicies.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    stepOrder: integer('step_order').notNull(),
    delayMinutes: integer('delay_minutes').notNull(),
    notifyType: text('notify_type').notNull(),
    notifyTargetIds: uuid('notify_target_ids').array().notNull().default(sql`ARRAY[]::uuid[]`),
    ifUnacked: boolean('if_unacked').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
  },
  (table) => [unique().on(table.policyId, table.stepOrder)]
);

export const incidentEscalationRuntime = pgTable('incident_escalation_runtime', {
  incidentId: uuid('incident_id')
    .notNull()
    .primaryKey()
    .references(() => incidents.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  policyId: uuid('policy_id').references(() => escalationPolicies.id, { onDelete: 'set null' }),
  ackedAt: timestamp('acked_at', { withTimezone: true, mode: 'string' }),
  ackedByMemberId: uuid('acked_by_member_id').references(() => members.id, { onDelete: 'set null' }),
  latestStepOrder: integer('latest_step_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
});

export const inboundIdempotency = pgTable(
  'inbound_idempotency',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    platform: text('platform').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    handledAt: timestamp('handled_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    responsePayload: jsonb('response_payload').$type<Record<string, unknown> | null>()
  },
  (table) => [unique().on(table.organizationId, table.platform, table.idempotencyKey)]
);

export const schemaMigrations = pgTable('schema_migrations', {
  version: text('version').primaryKey(),
  appliedAt: timestamp('applied_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
});

export const incidentRelations = relations(incidents, ({ many, one }) => ({
  events: many(incidentEvents),
  followUps: many(followUps),
  currentState: one(incidentCurrentState, {
    fields: [incidents.id],
    references: [incidentCurrentState.incidentId]
  })
}));
