export interface TeamsChoiceOption {
  title: string;
  value: string;
}

export function buildTeamsTriageCard(input: {
  incidentId: string;
  severity: string;
  areaOptions: TeamsChoiceOption[];
  assetOptions: TeamsChoiceOption[];
  initialAreaId?: string | null;
  initialDescription?: string | null;
}): Record<string, unknown> {
  return {
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      {
        type: 'TextBlock',
        text: 'Incident triage',
        weight: 'Bolder',
        size: 'Medium'
      },
      {
        type: 'Input.ChoiceSet',
        id: 'severity',
        label: 'Severity',
        isRequired: true,
        choices: [
          { title: 'SEV-1 (line down / safety risk)', value: 'SEV1' },
          { title: 'SEV-2 (degraded output)', value: 'SEV2' },
          { title: 'SEV-3 (minor impact)', value: 'SEV3' }
        ],
        value: input.severity,
        style: 'expanded'
      },
      {
        type: 'Input.ChoiceSet',
        id: 'areaId',
        label: 'Area',
        choices: [{ title: 'Unspecified', value: '' }, ...input.areaOptions],
        value: input.initialAreaId ?? '',
        style: 'compact'
      },
      {
        type: 'Input.ChoiceSet',
        id: 'assetIds',
        label: 'Affected assets',
        choices: input.assetOptions,
        isMultiSelect: true,
        style: 'compact'
      },
      {
        type: 'Input.Text',
        id: 'description',
        label: 'Brief description',
        isMultiline: true,
        value: input.initialDescription ?? ''
      }
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Submit triage',
        data: {
          haveriAction: 'triage_submit',
          incidentId: input.incidentId
        }
      }
    ]
  };
}

export function buildTeamsResolutionCard(input: {
  incidentId: string;
  initialSummary?: string;
}): Record<string, unknown> {
  return {
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      {
        type: 'TextBlock',
        text: 'Resolve incident',
        weight: 'Bolder',
        size: 'Medium'
      },
      {
        type: 'Input.Text',
        id: 'whatHappened',
        label: 'What happened',
        isMultiline: true,
        value: input.initialSummary ?? ''
      },
      {
        type: 'Input.Text',
        id: 'rootCause',
        label: 'Root cause',
        isMultiline: true
      },
      {
        type: 'Input.Text',
        id: 'resolution',
        label: 'Resolution',
        isMultiline: true
      },
      {
        type: 'Input.Text',
        id: 'followUps',
        label: 'Follow-up actions (one per line)',
        isMultiline: true
      }
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Resolve incident',
        data: {
          haveriAction: 'resolve_submit',
          incidentId: input.incidentId
        }
      }
    ]
  };
}
