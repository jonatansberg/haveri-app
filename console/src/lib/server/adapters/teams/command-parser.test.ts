import { describe, expect, it } from 'vitest';
import { parseTeamsCommand } from './command-parser';

describe('parseTeamsCommand', () => {
  it('parses incident declare command', () => {
    const command = parseTeamsCommand('/incident SEV1 Conveyor line stopped');
    expect(command).toEqual({
      type: 'declare',
      severity: 'SEV1',
      title: 'Conveyor line stopped'
    });
  });

  it('parses incident declare command with responsible and comms refs', () => {
    const command = parseTeamsCommand('/incident SEV2 @resp:Alex @comms:Sara Press line unstable');
    expect(command).toEqual({
      type: 'declare',
      severity: 'SEV2',
      title: 'Press line unstable',
      responsibleLeadRef: 'Alex',
      commsLeadRef: 'Sara'
    });
  });

  it('parses /haveri declare command with default severity', () => {
    const command = parseTeamsCommand('/haveri Line 2 pressure drop');
    expect(command).toEqual({
      type: 'declare',
      severity: 'SEV2',
      title: 'Line 2 pressure drop'
    });
  });

  it('parses status command', () => {
    const command = parseTeamsCommand('/status 123 RESOLVED');
    expect(command).toEqual({
      type: 'status',
      incidentId: '123',
      status: 'RESOLVED'
    });
  });

  it('parses shorthand investigating command', () => {
    const command = parseTeamsCommand('/investigating');
    expect(command).toEqual({
      type: 'status',
      incidentId: null,
      status: 'INVESTIGATING'
    });
  });

  it('parses shorthand mitigated command with incident id', () => {
    const command = parseTeamsCommand('/mitigated 123');
    expect(command).toEqual({
      type: 'status',
      incidentId: '123',
      status: 'MITIGATED'
    });
  });

  it('parses severity command with numeric shorthand', () => {
    const command = parseTeamsCommand('/severity 1');
    expect(command).toEqual({
      type: 'severity',
      incidentId: null,
      severity: 'SEV1'
    });
  });

  it('parses lead command', () => {
    const command = parseTeamsCommand('/lead @Alex Rivera');
    expect(command).toEqual({
      type: 'lead',
      incidentId: null,
      memberRef: 'Alex Rivera'
    });
  });

  it('returns null for non-command messages', () => {
    const command = parseTeamsCommand('hello team');
    expect(command).toBeNull();
  });

  it('returns unknown for malformed command', () => {
    const command = parseTeamsCommand('/incident');
    expect(command).toEqual({ type: 'unknown', raw: '/incident' });
  });
});
