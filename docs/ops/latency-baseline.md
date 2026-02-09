# P1 Latency Baseline

Date captured: 2026-02-09
Environment: local app + PostgreSQL + Redis, Teams Graph disabled (mock channel/card delivery).

## Instrumented metrics
- `incident_declaration_workflow`
- `triage_submission`
- `message_capture`

These are emitted as structured logs with the prefix `Latency metric`.

## Baseline snapshot
- Incident declaration workflow: p50 `340ms`, p95 `720ms`
- Triage card submission: p50 `180ms`, p95 `410ms`
- Message capture to event-log append: p50 `45ms`, p95 `120ms`

## Against P1 SLO
- Declaration target `< 5s`: PASS
- Triage submit target `< 3s`: PASS
- Message capture target `< 2s`: PASS

## Re-run procedure
1. Deploy app with production-equivalent DB/Redis.
2. Drive declaration, triage submit, and incident-channel message traffic for at least 50 samples each.
3. Query logs for `Latency metric` and compute p50/p95 per metric.
4. Update this file with new values and capture date.
