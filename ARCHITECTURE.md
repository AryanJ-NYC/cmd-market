# Architecture

## Overview

CMD Market is currently a frontend-first Turborepo scaffold for a future marketplace product. The repo is intentionally small: one Next.js app, shared workspace config packages, and a documentation system designed for both humans and coding agents.

## Repo Shape

- `apps/web`: the Next.js App Router application for the CMD Market web experience
- `packages/typescript-config`: shared TypeScript base and Next.js configs
- `packages/tailwind-config`: shared Tailwind stylesheet entrypoint used by the web app
- `docs/`: durable product, development, testing, planning, and reference docs

## Runtime Boundaries

- The only runtime app today is the web frontend in `apps/web`.
- There is no backend, worker, or database in this repo yet.
- Tailwind PostCSS config is kept local to `apps/web` because Next.js 16 Turbopack expects app-local PostCSS wiring.

## Key Flows

- `pnpm dev` runs the Turborepo workspace and starts the web app.
- The web app imports its global stylesheet from the shared Tailwind package.
- The homepage is intentionally minimal and exists only to prove the scaffold works end-to-end.

## Constraints

- Keep the monorepo shape minimal until real shared product code exists.
- Prefer durable repo-local docs over chat-only context.
- Keep `AGENTS.md` short and use linked docs as the source of truth.
- Development uses `WATCHPACK_POLLING=true` in the app dev script to avoid local `EMFILE` watcher-limit failures in this environment.
