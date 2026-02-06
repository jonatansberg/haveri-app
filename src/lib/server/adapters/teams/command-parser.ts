import type { IncidentSeverity, IncidentStatus } from '$lib/shared/domain';
import { incidentSeverities, incidentStatuses } from '$lib/shared/domain';

export type TeamsCommand =
  | {
      type: 'declare';
      severity: IncidentSeverity;
      title: string;
      responsibleLeadRef?: string;
      commsLeadRef?: string;
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
const responsibleLeadRegex = /^@resp:(.+)$/i;
const commsLeadRegex = /^@comms:(.+)$/i;

function parseRoleRefs(tokens: string[]): {
  cleanedTokens: string[];
  responsibleLeadRef?: string;
  commsLeadRef?: string;
} {
  const cleanedTokens: string[] = [];
  let responsibleLeadRef: string | undefined;
  let commsLeadRef: string | undefined;

  for (const token of tokens) {
    const responsibleMatch = responsibleLeadRegex.exec(token);
    if (responsibleMatch?.[1]) {
      responsibleLeadRef = responsibleMatch[1];
      continue;
    }

    const commsMatch = commsLeadRegex.exec(token);
    if (commsMatch?.[1]) {
      commsLeadRef = commsMatch[1];
      continue;
    }

    cleanedTokens.push(token);
  }

  return {
    cleanedTokens,
    ...(responsibleLeadRef ? { responsibleLeadRef } : {}),
    ...(commsLeadRef ? { commsLeadRef } : {})
  };
}

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

    const roles = parseRoleRefs(titleParts);
    const title = roles.cleanedTokens.join(' ').trim();
    if (!title) {
      return { type: 'unknown', raw: trimmed };
    }

    return {
      type: 'declare',
      severity: severityRaw.toUpperCase() as IncidentSeverity,
      title,
      ...(roles.responsibleLeadRef ? { responsibleLeadRef: roles.responsibleLeadRef } : {}),
      ...(roles.commsLeadRef ? { commsLeadRef: roles.commsLeadRef } : {})
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
