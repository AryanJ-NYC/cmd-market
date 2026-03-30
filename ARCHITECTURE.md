# Architecture

## Overview

CMD Market is a Turborepo with one Next.js app that now carries the first marketplace backend slices inside the web runtime. The repo is still intentionally small, but it now includes seller workspace auth, local PostgreSQL, Prisma-managed persistence, and the first draft-listing plus direct-upload media flow alongside the frontend.

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
- Seller-specific data currently lives in four custom tables:
  - `seller_account`
  - `audit_event`
  - `listing`
  - `listing_media`
- DigitalOcean Spaces is used for direct image uploads through presigned `PUT` URLs. Only Spaces credentials are env-driven right now; region, bucket, and public asset host are still hard-coded placeholders in `apps/web/lib/storage/spaces.ts`.

## Seller Flow

- Browser sellers sign in at `/sign-in`.
- Seller workspace creation and selection live under `/seller/workspace`, with workspace activation handled through a server action instead of a mutating `GET` route.
- Seller settings and OpenClaw authorization live under `/seller/settings`.
- Seller request resolution is shared between browser sessions and `x-api-key` requests.
- Development eligibility override is only available outside production, even when `DEV_SELLER_OVERRIDE_EMAILS` is set.
- The first seller APIs are:
  - `GET /api/seller/context`
  - `GET /api/seller/publishability`
  - `POST /api/seller/listings`
  - `POST /api/seller/upload-sessions`
  - `POST /api/seller/listings/:listingId/media`

## Draft Listing And Media Flow

- Issue `#2` introduces a thin draft listing foundation so later listing-edit and publish work can build on a real persisted resource.
- Sellers create a blank draft first through `POST /api/seller/listings`.
- Upload sessions are draft-scoped, not global. `POST /api/seller/upload-sessions` requires a seller-owned `listing_id`, validates the draft is still in `draft` status, and returns direct-to-Spaces `PUT` instructions.
- Asset keys now live under `listings/drafts/{listing_id}/...` so attachment can enforce draft ownership without a separate asset table in this slice.
- `POST /api/seller/listings/:listingId/media` persists attached media rows in `listing_media`, derives stable public URLs from the configured Spaces asset host, and writes audit events for media attachment.

## Key Flows

- `pnpm dev` runs the Turborepo workspace and starts the web app.
- `pnpm db:start` starts the repo-managed PostgreSQL container.
- `pnpm db:migrate` applies Prisma migrations and regenerates the Prisma client for `apps/web`.
- The web app imports its global stylesheet from the shared Tailwind package.
- Seller workspace pages, seller APIs, BetterAuth routes, and the direct-upload draft media flow now run end-to-end against PostgreSQL plus DigitalOcean Spaces.

## Constraints

- Keep the monorepo shape minimal until real shared product code exists.
- Prefer durable repo-local docs over chat-only context.
- Keep `AGENTS.md` short and use linked docs as the source of truth.
- Development uses `WATCHPACK_POLLING=true` in the app dev script to avoid local `EMFILE` watcher-limit failures in this environment.
