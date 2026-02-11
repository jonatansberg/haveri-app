export const incidentStatuses = [
  'DECLARED',
  'INVESTIGATING',
  'MITIGATED',
  'RESOLVED',
  'CLOSED'
] as const;

export const incidentSeverities = ['SEV1', 'SEV2', 'SEV3'] as const;

export type IncidentStatus = (typeof incidentStatuses)[number];
export type IncidentSeverity = (typeof incidentSeverities)[number];

export const followUpStatuses = ['OPEN', 'IN_PROGRESS', 'DONE'] as const;
export type FollowUpStatus = (typeof followUpStatuses)[number];

export type IncidentEventType =
  | 'message'
  | 'status_change'
  | 'severity_change'
  | 'escalation'
  | 'assignment'
  | 'comms_assignment'
  | 'action_taken'
  | 'attachment'
  | 'bot_guidance'
  | 'triage_response'
  | 'annotation'
  | 'declared'
  | 'resolved'
  | 'closed'
  | 'follow_up_created';

export type ActorType = 'member' | 'system' | 'integration';

export interface IncidentEvent {
  organizationId: string;
  incidentId: string;
  eventType: IncidentEventType;
  eventVersion: number;
  schemaVersion: number;
  actorType: ActorType;
  actorMemberId?: string | null;
  actorExternalId?: string | null;
  sourcePlatform?: string | null;
  sourceEventId?: string | null;
  payload: Record<string, unknown>;
  rawSourcePayload?: Record<string, unknown> | null;
}

export interface DeclaredIncident {
  id: string;
  organizationId: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  declaredByMemberId: string | null;
  declaredAt: string;
  facilityId: string;
  areaId: string | null;
  assignedToMemberId: string | null;
  commsLeadMemberId: string | null;
  chatPlatform: string;
  chatChannelRef: string;
  globalChannelRef: string | null;
  globalMessageRef: string | null;
  tags: string[];
}

export interface IncidentSummaryInput {
  whatHappened: string;
  rootCause: string;
  resolution: string;
  impact: Record<string, unknown>;
  aiSummary?: string | null;
}
