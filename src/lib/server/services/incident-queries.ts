import { aliasedTable, and, asc, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import {
  areas,
  facilities,
  followUps,
  incidentCurrentState,
  incidentEvents,
  incidents,
  incidentSummaries,
  members
} from '$lib/server/db/schema';
import { NotFoundError } from './errors';

export async function listIncidents(organizationId: string): Promise<
  {
    id: string;
    title: string;
    status: string;
    severity: string;
    declaredAt: string;
    facilityName: string;
    areaName: string | null;
    responsibleLead: string | null;
    commsLead: string | null;
  }[]
> {
  const responsibleMember = aliasedTable(members, 'responsible_member');
  const commsMember = aliasedTable(members, 'comms_member');

  const rows = await db
    .select({
      id: incidents.id,
      title: incidents.title,
      status: incidentCurrentState.status,
      severity: incidentCurrentState.severity,
      declaredAt: incidents.declaredAt,
      facilityName: facilities.name,
      areaName: areas.name,
      responsibleLead: responsibleMember.name,
      commsLead: commsMember.name
    })
    .from(incidents)
    .innerJoin(
      incidentCurrentState,
      and(
        eq(incidentCurrentState.incidentId, incidents.id),
        eq(incidentCurrentState.organizationId, incidents.organizationId)
      )
    )
    .innerJoin(facilities, eq(facilities.id, incidents.facilityId))
    .leftJoin(areas, eq(areas.id, incidents.areaId))
    .leftJoin(responsibleMember, eq(responsibleMember.id, incidentCurrentState.assignedToMemberId))
    .leftJoin(commsMember, eq(commsMember.id, incidents.commsLeadMemberId))
    .where(eq(incidents.organizationId, organizationId))
    .orderBy(desc(incidents.declaredAt));

  return rows;
}

export async function getIncidentDetail(organizationId: string, incidentId: string): Promise<{
  incident: {
    id: string;
    title: string;
    status: string;
    severity: string;
    declaredAt: string;
    facilityName: string;
    areaName: string | null;
    responsibleLead: string | null;
    commsLead: string | null;
    responsibleLeadMemberId: string | null;
    commsLeadMemberId: string | null;
    tags: string[];
    chatChannelRef: string;
    globalChannelRef: string | null;
    globalMessageRef: string | null;
    chatPlatform: string;
  };
  summary: {
    whatHappened: string;
    rootCause: string;
    resolution: string;
    impact: Record<string, unknown>;
    aiSummary: string | null;
  } | null;
  events: {
    id: string;
    sequence: number;
    eventType: string;
    actorType: string;
    actorMemberId: string | null;
    actorExternalId: string | null;
    payload: Record<string, unknown>;
    createdAt: string;
  }[];
  followUps: {
    id: string;
    description: string;
    status: string;
    dueDate: string | null;
    assignedToMemberId: string | null;
  }[];
}> {
  const responsibleMember = aliasedTable(members, 'responsible_member');
  const commsMember = aliasedTable(members, 'comms_member');

  const incidentRow = await db
    .select({
      id: incidents.id,
      title: incidents.title,
      status: incidentCurrentState.status,
      severity: incidentCurrentState.severity,
      declaredAt: incidents.declaredAt,
      facilityName: facilities.name,
      areaName: areas.name,
      responsibleLead: responsibleMember.name,
      commsLead: commsMember.name,
      responsibleLeadMemberId: incidents.assignedToMemberId,
      commsLeadMemberId: incidents.commsLeadMemberId,
      tags: incidents.tags,
      chatChannelRef: incidents.chatChannelRef,
      globalChannelRef: incidents.globalChannelRef,
      globalMessageRef: incidents.globalMessageRef,
      chatPlatform: incidents.chatPlatform,
      summaryWhatHappened: incidentSummaries.whatHappened,
      summaryRootCause: incidentSummaries.rootCause,
      summaryResolution: incidentSummaries.resolution,
      summaryImpact: incidentSummaries.impact,
      summaryAi: incidentSummaries.aiSummary
    })
    .from(incidents)
    .innerJoin(
      incidentCurrentState,
      and(
        eq(incidentCurrentState.incidentId, incidents.id),
        eq(incidentCurrentState.organizationId, incidents.organizationId)
      )
    )
    .innerJoin(facilities, eq(facilities.id, incidents.facilityId))
    .leftJoin(areas, eq(areas.id, incidents.areaId))
    .leftJoin(responsibleMember, eq(responsibleMember.id, incidentCurrentState.assignedToMemberId))
    .leftJoin(commsMember, eq(commsMember.id, incidents.commsLeadMemberId))
    .leftJoin(
      incidentSummaries,
      and(
        eq(incidentSummaries.incidentId, incidents.id),
        eq(incidentSummaries.organizationId, incidents.organizationId)
      )
    )
    .where(and(eq(incidents.organizationId, organizationId), eq(incidents.id, incidentId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!incidentRow) {
    throw new NotFoundError(`Incident ${incidentId} not found`);
  }

  const events = await db
    .select({
      id: incidentEvents.id,
      sequence: incidentEvents.sequence,
      eventType: incidentEvents.eventType,
      actorType: incidentEvents.actorType,
      actorMemberId: incidentEvents.actorMemberId,
      actorExternalId: incidentEvents.actorExternalId,
      payload: incidentEvents.payload,
      createdAt: incidentEvents.createdAt
    })
    .from(incidentEvents)
    .where(
      and(
        eq(incidentEvents.organizationId, organizationId),
        eq(incidentEvents.incidentId, incidentId)
      )
    )
    .orderBy(asc(incidentEvents.sequence));

  const incidentFollowUps = await db
    .select({
      id: followUps.id,
      description: followUps.description,
      status: followUps.status,
      dueDate: followUps.dueDate,
      assignedToMemberId: followUps.assignedToMemberId
    })
    .from(followUps)
    .where(and(eq(followUps.organizationId, organizationId), eq(followUps.incidentId, incidentId)))
    .orderBy(asc(followUps.createdAt));

  const summary = incidentRow.summaryWhatHappened
    ? {
        whatHappened: incidentRow.summaryWhatHappened,
        rootCause: incidentRow.summaryRootCause ?? '',
        resolution: incidentRow.summaryResolution ?? '',
        impact: incidentRow.summaryImpact ?? {},
        aiSummary: incidentRow.summaryAi
      }
    : null;

  return {
    incident: {
      id: incidentRow.id,
      title: incidentRow.title,
      status: incidentRow.status,
      severity: incidentRow.severity,
      declaredAt: incidentRow.declaredAt,
      facilityName: incidentRow.facilityName,
      areaName: incidentRow.areaName,
      responsibleLead: incidentRow.responsibleLead,
      commsLead: incidentRow.commsLead,
      responsibleLeadMemberId: incidentRow.responsibleLeadMemberId,
      commsLeadMemberId: incidentRow.commsLeadMemberId,
      tags: incidentRow.tags,
      chatChannelRef: incidentRow.chatChannelRef,
      globalChannelRef: incidentRow.globalChannelRef,
      globalMessageRef: incidentRow.globalMessageRef,
      chatPlatform: incidentRow.chatPlatform
    },
    summary,
    events,
    followUps: incidentFollowUps
  };
}

export async function findIncidentByChannel(
  organizationId: string,
  platform: string,
  channelRef: string
): Promise<{ id: string; title: string } | null> {
  const row = await db
    .select({ id: incidents.id, title: incidents.title })
    .from(incidents)
    .where(
      and(
        eq(incidents.organizationId, organizationId),
        eq(incidents.chatPlatform, platform),
        eq(incidents.chatChannelRef, channelRef)
      )
    )
    .orderBy(desc(incidents.declaredAt))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return row;
}
