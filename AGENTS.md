# Agent Operating Notes

## Refactor Posture (Required)
- Prioritize ruthless simplification and refactoring over preserving old structure.
- There is no live production usage to protect, so breaking changes are acceptable when they reduce complexity.
- Do not keep backward-compatibility shims, migration aliases, or dual-path flows unless explicitly requested in the current task.

## Teams Tunnel Workflow (Required)
- Use a stable tunnel hostname for Teams testing. Do not use random quick-tunnel URLs.
- Use `pnpm teams:sync-tunnel -- https://<stable-hostname>` to update `integrations/teams/.env.teams-package`.
- Keep tunnel/runtime commands aligned with named Cloudflare tunnel usage:
  - `cloudflared tunnel run haveri-dev`
  - `pnpm teams:sync-tunnel -- https://<stable-hostname>`
- Do not add compatibility aliases for old tunnel commands. Keep one path only.

## Regression Loop
- Run `pnpm agent:loop` before/after fixes to validate unit tests + public Playwright E2E.
