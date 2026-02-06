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

  it('parses status command', () => {
    const command = parseTeamsCommand('/status 123 RESOLVED');
    expect(command).toEqual({
      type: 'status',
      incidentId: '123',
      status: 'RESOLVED'
    });
  });

  it('returns null for non-command messages', () => {
    const command = parseTeamsCommand('hello team');
    expect(command).toBeNull();
  });

  it('returns unknown for malformed command', () => {
    const command = parseTeamsCommand('/incident bad');
    expect(command).toEqual({ type: 'unknown', raw: '/incident bad' });
  });
});
