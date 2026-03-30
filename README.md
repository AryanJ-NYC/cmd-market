# CMD Market

CMD Market is a peer-to-peer marketplace operated by Scarce City, Inc. Sellers list physical goods through OpenClaw-powered workflows, and buyers discover items through both the CMD Market web app and their own agents.

## Current Scope

This repository currently contains CMD Market's first real public and seller-facing slice:

- a Turborepo workspace
- one Next.js web app in `apps/web`
- shared TypeScript and Tailwind-related workspace packages
- a public homepage, seller entry page, and generated discovery routes at `/llms.txt` and `/openapi.json`
- browser seller bootstrap and seller-scoped API routes for the current draft-listing/media flow

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Commands

- `pnpm dev` runs the workspace in development mode
- `pnpm build` builds the workspace
- `pnpm lint` runs linting
- `pnpm typecheck` runs TypeScript checks

## Documentation

- `AGENTS.md` for the repo doc map and task routing
- `ARCHITECTURE.md` for the current system shape
- `docs/index.md` for the durable documentation index
