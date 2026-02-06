# Command And Event Catalog

## Teams Commands
- `/incident <SEV1|SEV2|SEV3> <title>`
  - Declares a new incident.
  - Creates `declared` event and initializes incident projection.
- `/status <incidentId> <DECLARED|INVESTIGATING|MITIGATED|RESOLVED|CLOSED>`
  - Appends `status_change` event (valid transitions enforced).
- `/resolve <incidentId> <summary text>`
  - Appends `status_change` to `RESOLVED` and `resolved` summary event.
- `/ack <incidentId>`
  - Marks escalation as acknowledged and appends `escalation` event.

Unknown or malformed commands return help guidance.

## Incident Event Types (Implemented)
- `declared`
  - Payload: `title`, `severity`, `facilityId`, optional `areaId`, `assetIds`.
- `message`
  - Payload: raw captured message text + sender metadata.
- `status_change`
  - Payload: `from`, `to`.
- `severity_change`
  - Payload: `from`, `to`.
- `assignment`
  - Payload: `assignedToMemberId`.
- `resolved`
  - Payload: `summary` object.
- `follow_up_created`
  - Payload: `followUpId`, `description`, assignee, due date.
- `closed`
  - Payload: `followUpCount`.
- `escalation`
  - Payload variants:
    - `action: policy_selected` (+ policy metadata)
    - `action: step_executed` (+ step metadata)
    - `action: acknowledged`

## Web Actions
- Dashboard declare incident form.
- Incident page actions:
  - Update status
  - Update severity
  - Assign lead
  - Resolve incident
  - Close incident with follow-up lines
  - Acknowledge escalation
  - Update follow-up status
