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
      incidentId: string | null;
      summaryText: string;
    }
  | {
      type: 'status';
      incidentId: string | null;
      status: IncidentStatus;
    }
  | {
      type: 'ack';
      incidentId: string | null;
    }
  | {
      type: 'severity';
      incidentId: string | null;
      severity: IncidentSeverity;
    }
  | {
      type: 'lead';
      incidentId: string | null;
      memberRef: string;
    }
  | {
      type: 'unknown';
      raw: string;
    };

const severitySet = new Set<string>(incidentSeverities);
const statusSet = new Set<string>(incidentStatuses);
const responsibleLeadRegex = /^@resp:(.+)$/i;
const commsLeadRegex = /^@comms:(.+)$/i;
const incidentCommands = new Set(['/incident', '/haveri']);

function parseSeverityToken(token: string | undefined): IncidentSeverity | null {
  if (!token) {
    return null;
  }

  const normalized = token.toUpperCase();

  if (normalized === '1') {
    return 'SEV1';
  }

  if (normalized === '2') {
    return 'SEV2';
  }

  if (normalized === '3') {
    return 'SEV3';
  }

  return severitySet.has(normalized) ? (normalized as IncidentSeverity) : null;
}

function cleanMemberRef(raw: string): string {
  return raw.replace(/^@+/, '').trim();
}

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

  if (incidentCommands.has(normalized)) {
    const [firstToken, ...remainingTokens] = parts;
    const parsedSeverity = parseSeverityToken(firstToken);
    const severity = parsedSeverity ?? 'SEV2';
    const titleTokens = parsedSeverity ? remainingTokens : parts;
    const roles = parseRoleRefs(titleTokens);
    const title = roles.cleanedTokens.join(' ').trim();
    if (!title) {
      return { type: 'unknown', raw: trimmed };
    }

    return {
      type: 'declare',
      severity,
      title,
      ...(roles.responsibleLeadRef ? { responsibleLeadRef: roles.responsibleLeadRef } : {}),
      ...(roles.commsLeadRef ? { commsLeadRef: roles.commsLeadRef } : {})
    };
  }

  if (normalized === '/resolve') {
    const [firstToken, ...summaryParts] = parts;
    if (!firstToken) {
      return {
        type: 'resolve',
        incidentId: null,
        summaryText: 'Resolved via Teams command'
      };
    }

    return {
      type: 'resolve',
      incidentId: firstToken,
      summaryText: summaryParts.join(' ').trim() || 'Resolved via Teams command'
    };
  }

  if (normalized === '/status') {
    const [firstToken, secondToken] = parts;
    const firstIsStatus = firstToken && statusSet.has(firstToken.toUpperCase());
    const secondIsStatus = secondToken && statusSet.has(secondToken.toUpperCase());

    if (firstIsStatus) {
      return {
        type: 'status',
        incidentId: null,
        status: firstToken.toUpperCase() as IncidentStatus
      };
    }

    if (!firstToken || !secondIsStatus) {
      return { type: 'unknown', raw: trimmed };
    }

    return {
      type: 'status',
      incidentId: firstToken,
      status: secondToken.toUpperCase() as IncidentStatus
    };
  }

  if (normalized === '/ack') {
    const [incidentId] = parts;

    return {
      type: 'ack',
      incidentId: incidentId ?? null
    };
  }

  if (normalized === '/investigating' || normalized === '/mitigated') {
    const [incidentId] = parts;

    return {
      type: 'status',
      incidentId: incidentId ?? null,
      status: normalized === '/investigating' ? 'INVESTIGATING' : 'MITIGATED'
    };
  }

  if (normalized === '/severity') {
    const [firstToken, secondToken] = parts;
    const firstSeverity = parseSeverityToken(firstToken);
    if (firstSeverity) {
      return {
        type: 'severity',
        incidentId: null,
        severity: firstSeverity
      };
    }

    const secondSeverity = parseSeverityToken(secondToken);
    if (!firstToken || !secondSeverity) {
      return { type: 'unknown', raw: trimmed };
    }

    return {
      type: 'severity',
      incidentId: firstToken,
      severity: secondSeverity
    };
  }

  if (normalized === '/lead') {
    const [firstToken, ...rest] = parts;
    if (!firstToken) {
      return { type: 'unknown', raw: trimmed };
    }

    if (firstToken.startsWith('@')) {
      const memberRef = cleanMemberRef([firstToken, ...rest].join(' '));
      if (!memberRef) {
        return { type: 'unknown', raw: trimmed };
      }

      return {
        type: 'lead',
        incidentId: null,
        memberRef
      };
    }

    const memberRef = cleanMemberRef(rest.join(' '));
    if (!memberRef) {
      return { type: 'unknown', raw: trimmed };
    }

    return {
      type: 'lead',
      incidentId: firstToken,
      memberRef
    };
  }

  return {
    type: 'unknown',
    raw: trimmed
  };
}
