# Haveri Monorepo

This repository is a pnpm workspace with three top-level packages:

- `console`: Haveri application (SvelteKit Node adapter, Fly deploy target)
- `web`: Haveri marketing site (SvelteKit Cloudflare adapter)
- `integrations/teams`: Teams app-package tooling and assets

## Requirements

- Node.js 22+
- pnpm 10+

## Workspace Setup

```bash
pnpm install
```

## Common Commands

- `pnpm dev`: Run console app locally
- `pnpm build`: Build console app
- `pnpm test`: Run console unit tests
- `pnpm agent:loop`: Run agent regression loop (unit + public Playwright E2E)
- `pnpm verify`: Run console check + lint + tests
- `pnpm web:dev`: Run marketing site locally
- `pnpm teams:check`: Print tenant-tailored Teams E2E checklist
- `pnpm teams:build-package`: Generate Teams manifest
- `pnpm teams:sync-tunnel -- <https-url>`: Update Teams package env values from stable tunnel URL
- `pnpm teams:zip-package`: Build Teams sideload zip

## Package Docs

- Console app docs: `console/README.md`
- Fly deployment runbook: `console/docs/fly-io.md`
- Teams E2E runbook: `console/docs/teams-e2e.md`
