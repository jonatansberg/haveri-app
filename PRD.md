# Haveri PRD (Reconciled P1 Outstanding Backlog)

**Version:** 0.2  
**Updated:** 2026-02-09  
**Scope:** Outstanding **P1** work only, reconciled against the current codebase.

This document intentionally keeps the strongest parts of the current build and only lists meaningful P1 gaps still required for launch-level scope.

## Baseline to Keep (Already Built, Do Not Regress)

1. Event-sourced incident core with append-only event writes, sequence ordering, and projection table (`incident_current_state`).
2. Incident lifecycle APIs and UI for declare/status/severity/assign/resolve/close/ack flows.
3. Teams webhook normalization + idempotency handling.
4. Teams incident channel creation + global adaptive incident card posting/updating.
5. BullMQ-based delayed escalation scheduler/worker.
6. Follow-up entity + status updates.
7. Authenticated web dashboard + route protection.

## Outstanding P1 Items

## 1) Infrastructure & Data Layer

- [ ] **Organization slug + tenant-safe context**
  Current build has org `id` + `name` only, and tenant context is taken from `x-org-id`.
  Implement `organizations.slug` (DB-unique) and bind tenant context to authenticated org membership (not header-only).
  **AC:** slug uniqueness enforced in DB; dashboard URLs support `/{slug}/...`; user from org A cannot access org B by changing headers.
  **Downstream (P2/P3):** stable slug/url identity is needed for docs links, analytics segmentation, and cross-system references.

- [ ] **Area model parity**
  Add `areas.description`.  
  Block area deletion when incidents reference that area (current behavior nulls/deletes instead of blocking).
  **AC:** deletion returns clear conflict error when linked incidents exist.

- [ ] **Team/member relationship parity**
  Replace single `members.team_id` model with many-to-many membership.
  Keep shift schedule optional, and enforce runtime “always active when no schedule” behavior in routing.
  **AC:** one member can belong to multiple teams; routing uses active team windows.

- [ ] **Member identity mapping completion**
  Implement auto-provision on first Teams interaction and map identity with Teams tenant boundary (`teams_user_id + teams_tenant_id` semantics).
  **AC:** first message from unknown Teams user creates member + mapping; repeat messages resolve same member; no cross-tenant identity collision.

- [ ] **Index and query-shape hardening**
  Add/validate indexes for incident list/filter workloads (`incidents.organization_id`, `incidents.facility_id`, and status path via projection).
  **AC:** explain plans show index use for default incident list and common filters.

- [ ] **Blob storage for attachments**
  Implement org-scoped object storage paths for incident files and enforce cross-org access denial.
  **AC:** file attached in Teams appears in incident detail and is inaccessible from other orgs.
  **Downstream (P2/P3):** same storage layout should reserve namespaces for SOP docs and exported reports.

## 2) Chat Adapter Layer

- [ ] **Platform-agnostic chat adapter contract**
  Introduce a formal adapter interface and depend on it from core services.
  **AC:** incident workflow runs unchanged with mock adapter vs Teams adapter.

- [ ] **Teams bot verification and framework compliance**
  Add inbound request verification compatible with Bot Framework/Teams production expectations.
  **AC:** unsigned/invalid requests are rejected; valid Teams activities process normally.

- [ ] **Command parity with PRD**
  Add support for configurable declaration command (`/haveri` or `/incident`) and missing lifecycle commands (`/investigating`, `/mitigated`, `/severity`, `/lead`).
  **AC:** command set works from Teams and maps to event log consistently.

- [ ] **Triage + resolution adaptive cards (structured input)**
  Implement triage card (severity/area/assets/description) and resolution card (summary/root cause/actions).
  **AC:** cards render on desktop/mobile, validate input, and append correct events.
  **Downstream (P2/P3):** structured fields and stable taxonomies are required for embeddings, similar-incident retrieval, and trend analysis.

- [ ] **Teams channel operations completion**
  Enforce naming format `inc-{incident_number}-{short_description}` (max 50 chars) and add routing-selected members automatically.
  **AC:** created channel name format is deterministic; targeted members are added.

- [ ] **Message capture robustness**
  Capture attachments and normalize channel identifiers so incident-channel messages always map correctly.
  **AC:** text + attachments from incident channel appear as timeline events with correct actor/source metadata.

## 3) Incident Lifecycle

- [ ] **Web declaration parity**
  Web declaration must include `area` (optional), `assets` (optional), and description, and trigger the same triage flow as Teams.
  **AC:** declaring from web and Teams produces equivalent initial event/timeline outcomes.

- [x] **Status transition policy finalization**
  Current state machine allows skips and does not allow `CLOSED -> INVESTIGATING`.
  Finalize and implement documented transition policy per PRD exception.
  **AC:** invalid transitions are blocked with explicit errors; reopen rule works as decided.

- [ ] **Severity change rules**
  Restrict severity changes after resolution and trigger re-routing on allowed changes.
  **AC:** SEV change appends event, reevaluates escalation policy, and emits new notifications when required.

- [ ] **Resolve flow follow-up creation**
  Move follow-up creation into resolve flow (not only close), with assignee fields captured from structured input.
  **AC:** resolving with N actions creates N linked follow-ups and posts summary message to Teams.

- [ ] **Close flow channel archive option**
  Add org-configurable channel archive behavior when incident closes.
  **AC:** close archives channel when enabled; leaves channel open when disabled.

- [x] **Lead reassignment in Teams**
  Add `/lead @person` parity with web reassignment.
  **AC:** command updates lead and appends `assignment` event.

## 4) Routing & Notifications

- [ ] **Policy matcher completeness**
  Expand conditions to severity + area + asset_type + time_window (facility timezone aware).
  **AC:** policy matching honors all condition dimensions.
  **Downstream (P2/P3):** richer condition dimensions improve later analytics and guided-triage quality.

- [ ] **Policy precedence + fallback**
  Implement deterministic specificity precedence and fallback behavior when no policy matches.
  **AC:** specific policy overrides general; fallback path triggers when none match.

- [ ] **Routing policy CRUD**
  Build dashboard/API CRUD for create/edit/delete/reorder with validation and duplicate-condition warning.
  **AC:** policy edits apply to new incidents only.

- [ ] **Notification delivery implementation**
  Escalation step execution must actually notify targets (channel membership + DM content).
  **AC:** routed users are added to channel and receive DM with required incident fields.

- [ ] **Per-step acknowledgment tracking**
  Track notified/acknowledged state by routing step; stop only that step’s timer when any target acknowledges.
  **AC:** dashboard shows per-target state and escalation progression correctly.

## 5) Follow-ups

- [ ] **Assignee notifications on creation**
  Notify assigned members immediately when follow-ups are created.
  **AC:** assignment DM sent with incident context and due date.

- [ ] **Reminder engine**
  Add reminder scheduling for D-1, due date, and overdue milestones.
  **AC:** reminders fire at configured times; overdue flags visible.

- [ ] **Follow-up dashboard filters**
  Provide status/assignee/facility/overdue filtering and default overdue-first sorting.
  **AC:** filter combinations return correct result sets.
  **Downstream (P2/P3):** keep follow-up schema extensible for webhook/external work-order IDs.

## 6) Web Dashboard

- [ ] **Incident list filters + default ordering**
  Add status/severity/facility/area/date filters and default open-by-severity ordering.
  **AC:** list behavior matches PRD filter/sort expectations.

- [ ] **Near-real-time incident list updates**
  Implement polling or websocket updates for new/changed incidents.
  **AC:** newly declared incident appears without full page reload.

- [ ] **Summary edit with annotation event**
  Allow post-resolution summary edits and append `annotation` event on change.
  **AC:** edited fields persist and timeline logs edit metadata.
  **Downstream (P2/P3):** edit history should be retained as high-quality feedback data for AI summarization improvements.

- [ ] **Configuration surfaces**
  Build P1 admin views for organization settings, facility/area/asset CRUD, team management, and routing editor.
  **AC:** full CRUD cycle works from dashboard for each config domain.

## 7) Marketing Site (P1 Scope Gap)

- [ ] **P1 marketing delivery not present in this codebase**
  Landing/about/contact/blog, static generation targets, analytics wiring, and form capture remain outstanding.
  **AC:** deliver P1 marketing pages with form submission + privacy-friendly analytics + social metadata.
  **Downstream (P2/P3):** docs/changelog/page IA should be chosen now to avoid URL/content migrations later.

## 8) Non-Functional P1

- [ ] **Latency SLO measurement**
  Instrument and document declaration, triage-submit, and message-capture timings.
  **AC:** baseline report captured under normal load.

- [ ] **Security hardening**
  Enforce tenant isolation with membership checks, not `x-org-id` alone.
  Add Teams webhook verification path.
  **AC:** cross-tenant access attempts fail regardless of header manipulation; invalid webhook signatures rejected.

- [ ] **Data residency controls**
  Fly app region is EU, but DB/blob residency guarantees are not enforced in-app.
  **AC:** documented and validated EU region for DB + storage in production.

- [ ] **Backup and recovery**
  Implement daily backups + retention and test restore runbook.
  **AC:** successful restore test with integrity verification.

## Notes on Scope Handling

1. This backlog omits already-complete P1 capabilities to keep execution focused.
2. Existing implementation that exceeds original PRD language should remain (no functional downgrade).
3. Where P2/P3 are likely to force schema or contract changes later, this doc flags them now to reduce rework.
