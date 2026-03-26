# Development

## Workspace

- Package manager: `pnpm`
- Monorepo runner: `turbo`
- App framework: Next.js App Router
- Styling: Tailwind CSS v4
- Database: PostgreSQL 16 via Docker Compose
- ORM: Prisma
- Auth: BetterAuth

## Environment

- Copy `apps/web/.env.example` to `apps/web/.env`.
- Local PostgreSQL defaults to `postgres://postgres:postgres@127.0.0.1:5433/cmd_market`.
- `BETTER_AUTH_SECRET` should be changed from the example value before sharing credentials or deploying.
- Twitter/X auth is optional for local development until you need the full sign-in flow.

## Commands

- `pnpm install`
- `pnpm db:start`
- `pnpm db:stop`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

## Seller Workspace Slice

- BetterAuth is mounted at `/api/auth/*`.
- Seller APIs live at:
  - `GET /api/seller/context`
  - `GET /api/seller/publishability`
- Seller UI entry points live at:
  - `/sign-in`
  - `/seller/workspace`
  - `/seller/settings`
- OpenClaw authorization is currently limited to one organization-owned API key per seller workspace.

## Database Workflow

- Schema source of truth: `apps/web/prisma/schema.prisma`
- Prisma config: `apps/web/prisma.config.ts`
- Generated SQL migrations: `apps/web/prisma/migrations/`
- Use `pnpm db:migrate` after schema changes instead of hand-writing SQL migrations.
- The Prisma client is regenerated on install through the root `postinstall` hook, and can be regenerated manually with `pnpm db:generate`.

## Current Conventions

- Keep the repo small until real shared product code exists.
- Put durable technical truth in `ARCHITECTURE.md` and focused docs under `docs/`.
- Keep `AGENTS.md` short and index-like.
- Prefer explicit workspace packages for shared config over ad hoc duplication.

## Documentation System

This repo follows a harness-style progressive disclosure model:

- `README.md` and `AGENTS.md` are entrypoints
- durable truth lives in focused docs
- plans live in `docs/plans/`
- scratch notes do not belong in version control

## Plan Lifecycle

- Start significant work in `docs/plans/active/`.
- When work finishes, keep the plan only if it captures lasting decisions.
- Move durable plans to `docs/plans/completed/`.
- Delete transient plans after their durable truths are absorbed by code or docs.

## Local Development Note

The web app dev script uses `WATCHPACK_POLLING=true` to avoid local `EMFILE` watcher-limit failures observed in this environment.
