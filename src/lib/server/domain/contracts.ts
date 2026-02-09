import type {
  DeclaredIncident,
  IncidentEvent,
  IncidentSeverity,
  IncidentStatus,
  IncidentSummaryInput
} from '$lib/shared/domain';

export interface DeclareIncidentInput {
  organizationId: string;
  title: string;
  severity: IncidentSeverity;
  declaredByMemberId?: string | null;
  facilityId: string;
  areaId?: string | null;
  assetIds?: string[];
  assignedToMemberId?: string | null;
  commsLeadMemberId?: string | null;
  chatPlatform: string;
  chatChannelRef: string;
  globalChannelRef?: string | null;
  globalMessageRef?: string | null;
  tags?: string[];
  actorExternalId?: string | null;
  rawSourcePayload?: Record<string, unknown> | null;
}

export interface UpdateStatusInput {
  organizationId: string;
  incidentId: string;
  newStatus: IncidentStatus;
  actorMemberId?: string | null;
  actorExternalId?: string | null;
}

export interface ChangeSeverityInput {
  organizationId: string;
  incidentId: string;
  severity: IncidentSeverity;
  actorMemberId?: string | null;
}

export interface AssignLeadInput {
  organizationId: string;
  incidentId: string;
  memberId: string;
  actorMemberId?: string | null;
}

export interface AssignCommsLeadInput {
  organizationId: string;
  incidentId: string;
  memberId: string;
  actorMemberId?: string | null;
}

export interface SetAnnouncementRefsInput {
  organizationId: string;
  incidentId: string;
  globalChannelRef?: string | null;
  globalMessageRef?: string | null;
}

export interface AddEventInput {
  event: IncidentEvent;
}

export interface ResolveIncidentInput {
  organizationId: string;
  incidentId: string;
  actorMemberId?: string | null;
  summary: IncidentSummaryInput;
}

export interface AnnotateSummaryInput {
  organizationId: string;
  incidentId: string;
  actorMemberId?: string | null;
  actorExternalId?: string | null;
  summary: IncidentSummaryInput;
}

export interface CloseIncidentInput {
  organizationId: string;
  incidentId: string;
  actorMemberId?: string | null;
  followUps: {
    description: string;
    assignedToMemberId?: string | null;
    dueDate?: string | null;
  }[];
}

export interface IncidentService {
  declareIncident(input: DeclareIncidentInput): Promise<DeclaredIncident>;
  updateStatus(input: UpdateStatusInput): Promise<void>;
  changeSeverity(input: ChangeSeverityInput): Promise<void>;
  assignLead(input: AssignLeadInput): Promise<void>;
  assignCommsLead(input: AssignCommsLeadInput): Promise<void>;
  setAnnouncementRefs(input: SetAnnouncementRefsInput): Promise<void>;
  addEvent(input: AddEventInput): Promise<void>;
  resolveIncident(input: ResolveIncidentInput): Promise<void>;
  annotateSummary(input: AnnotateSummaryInput): Promise<void>;
  closeIncident(input: CloseIncidentInput): Promise<void>;
}
