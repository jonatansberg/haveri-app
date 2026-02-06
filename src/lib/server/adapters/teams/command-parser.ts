import type { IncidentSeverity, IncidentStatus } from '$lib/shared/domain';
import { incidentSeverities, incidentStatuses } from '$lib/shared/domain';

export type TeamsCommand =
  | {
      type: 'declare';
      severity: IncidentSeverity;
      title: string;
    }
  | {
      type: 'resolve';
      incidentId: string;
      summaryText: string;
    }
  | {
      type: 'status';
      incidentId: string;
      status: IncidentStatus;
    }
  | {
      type: 'ack';
      incidentId: string;
    }
  | {
      type: 'unknown';
      raw: string;
    };

const severitySet = new Set<string>(incidentSeverities);
const statusSet = new Set<string>(incidentStatuses);

export function parseTeamsCommand(text: string): TeamsCommand | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/')) {
    return null;
  }

  const [command = '', ...parts] = trimmed.split(/\s+/);
  const normalized = command.toLowerCase();

  if (normalized === '/incident') {
    const [severityRaw, ...titleParts] = parts;
    if (!severityRaw || !severitySet.has(severityRaw.toUpperCase())) {
      return { type: 'unknown', raw: trimmed };
    }

    const title = titleParts.join(' ').trim();
    if (!title) {
      return { type: 'unknown', raw: trimmed };
    }

    return {
      type: 'declare',
      severity: severityRaw.toUpperCase() as IncidentSeverity,
      title
    };
  }

  if (normalized === '/resolve') {
    const [incidentId, ...summaryParts] = parts;
    if (!incidentId) {
      return { type: 'unknown', raw: trimmed };
    }

    return {
      type: 'resolve',
      incidentId,
      summaryText: summaryParts.join(' ').trim() || 'Resolved via Teams command'
    };
  }

  if (normalized === '/status') {
    const [incidentId, statusRaw] = parts;
    if (!incidentId || !statusRaw || !statusSet.has(statusRaw.toUpperCase())) {
      return { type: 'unknown', raw: trimmed };
    }

    return {
      type: 'status',
      incidentId,
      status: statusRaw.toUpperCase() as IncidentStatus
    };
  }

  if (normalized === '/ack') {
    const [incidentId] = parts;
    if (!incidentId) {
      return { type: 'unknown', raw: trimmed };
    }

    return {
      type: 'ack',
      incidentId
    };
  }

  return {
    type: 'unknown',
    raw: trimmed
  };
}
