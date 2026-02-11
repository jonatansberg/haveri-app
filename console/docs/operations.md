# Operations Guide

## Services
- Web/API process (SvelteKit): `pnpm dev`
- Escalation worker (BullMQ): `pnpm worker`

## Queues
- Queue name: `incident-escalation`
- Job name: `run-step`
- Job id format: `<incidentId>:<stepOrder>`

## Escalation Flow
1. Incident declaration occurs (web or Teams).
2. Matching escalation policy is selected for incident context.
3. Jobs are enqueued for each policy step with configured delay.
4. Worker executes each step if escalation is not acknowledged (when `if_unacked=true`).
5. Each executed step appends an `escalation` incident event.

## Idempotency
- Teams inbound messages are deduplicated using:
  - `organization_id`
  - `platform` (`teams`)
  - `idempotency_key` (event id)
- Webhook route accepts both simplified and native Teams activity payloads; both normalize to a single internal event envelope before idempotency lookup.

## Verify Before Commit
- `pnpm verify`
