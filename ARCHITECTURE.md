# Haveri - Incident Management Platform — Architecture & Domain Model

## Design Principles

1. **Chat-native, not chat-adjacent.** The chat platform is the primary interface, not a notification channel for a separate app. The web UI exists for configuration, dashboards, and review — not for real-time incident work.
2. **Capture by default.** Every message, action, and state change in an incident context becomes a structured event. Users shouldn't have to "log" things — they just communicate and the system structures it.
3. **Platform-agnostic core.** The domain logic knows nothing about Teams or Slack. Chat platforms are adapters.
4. **Event-sourced incidents.** An incident's timeline IS the source of truth, not a mutable record with a changelog. This gives you auditability for free and makes the intelligence layer possible later.
5. **Tenant isolation from day one.** Multi-tenancy at the data layer, even if you have one customer for months.

---

## Domain Model

### Core Entities

```
┌─────────────────────────────────────────────────────────────┐
│ ORGANIZATION (Tenant)                                       │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────────┐   │
│  │  Facility   │    │    Team     │    │     Member     │   │
│  │             │    │             │    │                │   │
│  │ name        │    │ name        │    │ name           │   │
│  │ timezone    │◄──►│ facility    │◄──►│ role           │   │
│  │ metadata    │    │ shift_info  │    │ chat_identity  │   │
│  └─────────────┘    └─────────────┘    │ contact_prefs  │   │
│         │                              └────────────────┘   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │    Area     │  (Production lines, zones, departments)    │
│  │             │                                            │
│  │ name        │                                            │
│  │ facility    │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │    Asset    │  (Equipment, machines, systems)            │
│  │             │                                            │
│  │ name        │                                            │
│  │ area        │                                            │
│  │ asset_type  │                                            │
│  │ metadata    │                                            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

### Incident Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│ INCIDENT                                                         │
│                                                                  │
│  id                                                              │
│  title                                                           │
│  status: DECLARED → INVESTIGATING → MITIGATED → RESOLVED → CLOSED│
│  severity: SEV1 (line down) / SEV2 (degraded) / SEV3 (minor)     │
│  declared_by: Member                                             │
│  declared_at: timestamp                                          │
│  facility: Facility                                              │
│  area: Area (optional)                                           │
│  assets: Asset[] (optional)                                      │
│  assigned_to: Member (incident lead)                             │
│  comms_lead: Member (optional stakeholder comms owner)           │
│  chat_channel_ref: string (platform-specific channel ID)         │
│  global_channel_ref: string (optional platform channel ref)       │
│  global_message_ref: string (optional platform message/card ref)  │
│  tags: string[]                                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ INCIDENT EVENTS (append-only, event-sourced)               │   │
│  │                                                            │   │
│  │  Event Types:                                              │   │
│  │  ├── message        — chat message captured from channel   │   │
│  │  ├── status_change  — DECLARED→INVESTIGATING, etc.         │   │
│  │  ├── severity_change                                       │   │
│  │  ├── escalation     — new people pulled in                 │   │
│  │  ├── assignment     — lead changed                         │   │
│  │  ├── comms_assignment— comms owner changed                 │   │
│  │  ├── action_taken   — explicit "I did X" log entries       │   │
│  │  ├── attachment     — photos, sensor readings, files       │   │
│  │  ├── bot_guidance   — SOP suggestion, similar incident     │   │
│  │  ├── triage_response— answers to structured triage Qs      │   │
│  │  └── annotation     — post-hoc notes added during review   │   │
│  │                                                            │   │
│  │  Every event has:                                          │   │
│  │    timestamp, actor (member or system), type, payload      │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ INCIDENT SUMMARY (generated at close, editable)            │   │
│  │                                                            │   │
│  │  what_happened: text                                       │   │
│  │  root_cause: text                                          │   │
│  │  resolution: text                                          │   │
│  │  impact: { duration, lines_affected, units_lost, ... }     │   │
│  │  follow_ups: FollowUp[]                                    │   │
│  │  ai_summary: text (Phase 2 — LLM-generated)                │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ FOLLOW-UP                                                  │   │
│  │                                                            │   │
│  │  description: text                                         │   │
│  │  assigned_to: Member                                       │   │
│  │  due_date: date                                            │   │
│  │  status: OPEN / IN_PROGRESS / DONE                         │   │
│  │  linked_incident: Incident                                 │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Escalation & Routing

```
┌──────────────────────────────────────────────────────────────┐
│ ESCALATION POLICY                                            │
│                                                              │
│  name: string                                                │
│  facility: Facility                                          │
│  conditions: {                                               │
│    severity: SEV1 | SEV2 | SEV3                              │
│    area: Area (optional)                                     │
│    asset_type: string (optional)                             │
│    time_of_day: shift hours (optional)                       │
│  }                                                           │
│                                                              │
│  steps: [                                                    │
│    { notify: Team | Member[], after: 0min },                 │
│    { notify: Team | Member[], after: 15min, if: unacked },   │
│    { notify: Team | Member[], after: 30min, if: unacked },   │
│  ]                                                           │
│                                                              │
│  This is what replaces "wake someone up at 3am." Instead:    │
│  SEV3 → shift team only, no escalation                       │
│  SEV2 → shift team → supervisor after 15min if no response   │
│  SEV1 → shift team + supervisor + prod manager immediately   │
└──────────────────────────────────────────────────────────────┘
```

### Knowledge Layer (Phase 2+)

```
┌──────────────────────────────────────────────────────────────┐
│ KNOWLEDGE BASE                                               │
│                                                              │
│  ┌──────────────┐     ┌──────────────────┐                   │
│  │     SOP      │     │  INCIDENT INSIGHT │ (auto-generated) │
│  │              │     │                  │                   │
│  │ title        │     │ pattern          │                   │
│  │ content      │     │ frequency        │                   │
│  │ applies_to:  │     │ related_assets   │                   │
│  │  assets[]    │     │ common_causes    │                   │
│  │  areas[]     │     │ effective_fixes  │                   │
│  │ version      │     │ source_incidents │                   │
│  │ embeddings[] │     └──────────────────┘                   │
│  └──────────────┘                                            │
│                                                              │
│  SOPs are uploaded docs, chunked and embedded.               │
│  Insights are derived from closed incident data over time.   │
│  Both feed the AI guidance during active incidents.          │
└──────────────────────────────────────────────────────────────┘
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CHAT PLATFORMS                                │
│                                                                     │
│  ┌──────────────────┐          ┌──────────────────┐                 │
│  │   MS Teams        │         │   Slack           │                │
│  │   (Phase 1)       │         │   (Phase 2-3)     │                │
│  └────────┬─────────┘          └────────┬─────────┘                 │
│           │                             │                           │
│           ▼                             ▼                           │
│  ┌──────────────────────────────────────────────────┐               │
│  │          CHAT ADAPTER LAYER                      │               │
│  │                                                  │               │
│  │  Translates platform-specific events into        │               │
│  │  platform-agnostic domain events.                │               │
│  │                                                  │               │
│  │  Responsibilities:                               │               │
│  │  - Receive messages, reactions, commands          │               │
│  │  - Create/manage channels                        │               │
│  │  - Send bot messages, cards, interactive prompts  │               │
│  │  - Map platform user IDs ↔ Member IDs            │               │
│  │                                                  │               │
│  │  Interface:                                      │               │
│  │    onMessage(channel, user, text, attachments)   │               │
│  │    onCommand(command, args, user, channel)        │               │
│  │    createChannel(name, members) → channel_ref    │               │
│  │    sendMessage(channel_ref, content)              │               │
│  │    sendInteractiveCard(channel_ref, card)         │               │
│  │    addMembers(channel_ref, members)               │               │
│  └──────────────────┬───────────────────────────────┘               │
│                     │                                               │
└─────────────────────┼───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CORE API                                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    INCIDENT SERVICE                          │    │
│  │                                                             │    │
│  │  declareIncident(who, what, where, severity)                │    │
│  │  updateStatus(incidentId, newStatus, actor)                 │    │
│  │  escalate(incidentId, policy)                               │    │
│  │  addEvent(incidentId, event)                                │    │
│  │  assignLead(incidentId, member)                             │    │
│  │  resolveIncident(incidentId, summary)                       │    │
│  │  closeIncident(incidentId, followUps[])                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   ESCALATION ENGINE                          │    │
│  │                                                             │    │
│  │  Evaluates policies against incident state.                 │    │
│  │  Triggers notifications via chat adapter.                   │    │
│  │  Tracks acknowledgment state.                               │    │
│  │  Manages timed escalation (unacked after N minutes).        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   TIMELINE SERVICE                           │    │
│  │                                                             │    │
│  │  Append-only event log per incident.                        │    │
│  │  Accepts raw chat messages → normalizes into events.        │    │
│  │  Supports enrichment (Phase 2: auto-tagging, sentiment).    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  FOLLOW-UP TRACKER                           │    │
│  │                                                             │    │
│  │  CRUD for follow-up actions from incidents.                 │    │
│  │  Sends reminders via chat adapter.                          │    │
│  │  Tracks completion state.                                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐    │
│           INTELLIGENCE SERVICE (Phase 2+)                           │
│  │                                                             │    │
│     Summarization (incident → structured summary)              │    │
│  │  Similar incident retrieval (embedding search)              │    │
│     SOP retrieval (RAG over uploaded docs)                     │    │
│  │  Trend detection (periodic analysis over incident data)     │    │
│     Guided triage (context-aware Q&A during incidents)         │    │
│  │                                                             │    │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      EVENT BUS                               │    │
│  │                                                             │    │
│  │  Internal pub/sub for decoupling services.                  │    │
│  │  incident.declared → escalation engine, timeline, channel   │    │
│  │  incident.message  → timeline, (phase 2: intelligence)      │    │
│  │  incident.resolved → follow-up tracker, (phase 2: summary) │    │
│  │  escalation.unacked → escalation engine (next step)         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                   │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐      │
│  │  PostgreSQL   │  │  Blob Store  │  │  Vector Store        │      │
│  │              │  │              │  │  (Phase 2+)          │      │
│  │  All domain  │  │  Attachments │  │                      │      │
│  │  entities    │  │  SOP docs    │  │  SOP embeddings      │      │
│  │  Event log   │  │  Photos      │  │  Incident embeddings │      │
│  │  Tenant data │  │  Exports     │  │  Similarity search   │      │
│  └──────────────┘  └──────────────┘  └──────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         WEB UI                                      │
│                                                                     │
│  Dashboard: open incidents, recent activity, stats                  │
│  Incident detail: full timeline view, summary, follow-ups           │
│  Configuration: escalation policies, teams, facilities, assets      │
│  Knowledge base: SOPs, past incidents, search (Phase 2+)            │
│  Analytics: trends, recurring issues, MTTR (Phase 3)                │
│                                                                     │
│  NOT used for real-time incident work — that happens in chat.       │
│  This is the "calm mode" interface for setup, review, and insights. │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### Event Sourcing for Incidents

The incident event log is append-only. You never update an incident's state directly — you append a `status_change` event, and the current state is derived. This gives you:
- Perfect audit trail (regulatory value, even for non-strict compliance)
- Ability to replay and reconstruct any point in an incident's history
- A natural feed for the intelligence layer (Phase 2+)
- The raw material for LLM summarization

In Phase 1 this can be simple: a Postgres table with `incident_id, event_type, timestamp, actor_id, payload JSONB`. No need for Kafka or a dedicated event store yet.

### Chat Adapter Abstraction

Define a clean interface between the chat platform and your domain logic from day one. Even if you only build the Teams adapter initially, this saves you from Teams-specific concepts leaking into your core logic. The adapter handles:
- Webhook ingestion (Teams sends events to your API)
- Outbound messaging (your services tell the adapter "send this to incident channel X")
- User identity mapping (Teams user ID ↔ your Member ID)
- Interactive cards/forms (platform-specific UI rendered by the adapter)

### Escalation as Configuration, Not Code

Escalation policies should be data, not hardcoded logic. A simple rule engine that evaluates `(severity, area, time_of_day, asset_type) → notification steps` lets customers self-serve without code changes. Start with a handful of conditions and a linear step chain; you can add complexity later.

### The "Incident Brain" Data Model

The long-term value proposition — the system getting smarter over time — depends on structured, queryable incident data. This means:

- Every incident is tagged with facility, area, and affected assets
- The event log captures not just what was said, but structured triage data (which line, what symptoms, what was tried)
- Incident summaries have structured fields (root cause category, resolution type, impact metrics) not just free text

In Phase 1, you capture this via the bot's triage questions. In Phase 2, the LLM can retroactively extract structure from unstructured chat. By Phase 3, you have enough data for meaningful pattern detection.

---

## Tech Stack Suggestion

| Layer | Phase 1 | Notes |
|-------|---------|-------|
| Runtime | Node.js/TypeScript |  |
| API + web app | SvelteKit | Dashboard and config interface. |
| Database | PostgreSQL + Drizzle | Single DB handles everything in Phase 1. |
| Auth | BetterAuth | |
| Blob storage | R2 |  |
| Chat integration | Teams Bot Framework SDK | Microsoft's bot framework is verbose but well-documented. |
| Hosting | Fly.io |   |
| Background jobs | Simple queue (BullMQ) | For timed escalations, reminders, async processing. |
| Vector store (Phase 2) | pgvector extension on Postgres | No separate infra needed. |
| LLM (Phase 2) | OpenAI API | Summarization, SOP retrieval, guided triage. |

---

## Phase 1 Scope — What to Build First

The minimum loop that proves value:

1. `/incident` command in Teams → declares incident, creates channel, starts timeline
2. Bot posts triage/workflow card with responsible lead (+ optional comms lead)
3. Bot posts/updates global incident summary card in configurable incident channel
4. All messages in channel auto-logged as timeline events
5. Escalation policy fires notifications based on severity
6. `/resolve` command → bot prompts for summary, creates incident record
7. Web dashboard shows incident list and timeline view
8. Follow-up actions can be created and assigned at close

Everything else — SOP retrieval, AI summaries, trend detection, analytics — waits for Phase 2. Get the basic loop right first.

---

## Implementation Status (MVP)

Implemented in this codebase:
- Drizzle/PostgreSQL schema for multi-tenant incident domain + Better Auth tables.
- Better Auth integration (`/api/auth`) with SvelteKit hooks and protected app/API flows.
- Event-sourced incident service with append-only timeline events and derived current-state projection.
- Follow-up tracker APIs and status updates.
- Teams webhook adapter with command parsing, idempotency handling, and Teams activity-payload normalization.
- Static incident workflow model (`v1-static`) with required responsible lead and optional comms lead.
- Organization-level Teams chat settings for global incident channel and incident channel creation behavior.
- Incident workflow orchestration service that creates Teams channels, posts adaptive cards to a global channel, and syncs announcement cards on incident state changes.
- Teams Graph SDK integration (`@microsoft/teams.graph` + endpoints) for channel creation and message/card operations.
- Escalation policy selection, BullMQ job scheduling, and worker-based escalation step execution.
- Web dashboard for incident declaration/listing and incident detail timeline with control actions.

Pending for later phases:
- SOP retrieval, semantic search, and AI-generated summaries.
- Trend analytics and recurring-issue detection.
