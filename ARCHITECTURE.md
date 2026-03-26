# Architecture

## Overview

CMD Market is a Turborepo with one Next.js app that now carries the first marketplace backend slice inside the web runtime. The repo is still intentionally small, but it now includes seller workspace auth, a local PostgreSQL database, and Prisma-managed persistence alongside the frontend.

## Repo Shape

- `apps/web`: the Next.js App Router application for the CMD Market web experience
- `packages/typescript-config`: shared TypeScript base and Next.js configs
- `packages/tailwind-config`: shared Tailwind stylesheet entrypoint used by the web app
- `docs/`: durable product, development, testing, planning, and reference docs

## Runtime Boundaries

- The only runtime app today is the web frontend in `apps/web`.
- `apps/web` now owns the first server-side marketplace behavior through App Router routes, server actions, BetterAuth, Prisma, and PostgreSQL.
- There is still no separate worker or standalone backend service in this repo.
- Tailwind PostCSS config is kept local to `apps/web` because Next.js 16 Turbopack expects app-local PostCSS wiring.

## Data And Auth

- Local development uses Docker Compose to run PostgreSQL 16 on `127.0.0.1:5433`.
- Prisma is the only checked-in database layer. Schema lives in `apps/web/prisma/schema.prisma`, config lives in `apps/web/prisma.config.ts`, and migrations live under `apps/web/prisma/migrations/`.
- BetterAuth is mounted at `apps/web/app/api/auth/[...all]/route.ts` and uses:
  - Twitter/X sign-in
  - organization workspaces
  - organization-owned API keys for OpenClaw
- Seller-specific data currently lives in two custom tables:
  - `seller_account`
  - `audit_event`

## Seller Flow

- Browser sellers sign in at `/sign-in`.
- Seller workspace creation and selection live under `/seller/workspace`.
- Seller settings and OpenClaw authorization live under `/seller/settings`.
- Seller request resolution is shared between browser sessions and `x-api-key` requests.
- The first seller APIs are:
  - `GET /api/seller/context`
  - `GET /api/seller/publishability`

## Key Flows

- `pnpm dev` runs the Turborepo workspace and starts the web app.
- `pnpm db:start` starts the repo-managed PostgreSQL container.
- `pnpm db:migrate` applies Prisma migrations and regenerates the Prisma client for `apps/web`.
- The web app imports its global stylesheet from the shared Tailwind package.
- Seller workspace pages, seller APIs, and BetterAuth routes now run end-to-end against PostgreSQL.

## Constraints

- Keep the monorepo shape minimal until real shared product code exists.
- Prefer durable repo-local docs over chat-only context.
- Keep `AGENTS.md` short and use linked docs as the source of truth.
- Development uses `WATCHPACK_POLLING=true` in the app dev script to avoid local `EMFILE` watcher-limit failures in this environment.
