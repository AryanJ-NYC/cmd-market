# Architecture

## Overview

CMD Market is a Turborepo with one Next.js app that now carries the first marketplace backend slices inside the web runtime. The repo is still intentionally small, but it now includes seller workspace auth, local PostgreSQL, Prisma-managed persistence, draft listing authoring, direct-upload media flow, publish validation, and the first public listing read surface alongside the frontend.

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
- Seller-specific data currently lives in eight custom marketplace tables:
  - `seller_account`
  - `audit_event`
  - `listing`
  - `listing_media`
  - `category`
  - `attribute_definition`
  - `category_attribute`
  - `listing_attribute_value`
- DigitalOcean Spaces is used for direct image uploads through presigned `PUT` URLs. Only Spaces credentials are env-driven right now; region, bucket, and public asset host are still hard-coded placeholders in `apps/web/lib/storage/spaces.ts`.
- Listing publish state is stored in the `ListingStatus` Prisma/Postgres enum.
- Structured category attribute types are stored in the `AttributeValueType` Prisma/Postgres enum.

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
  - `GET /api/seller/listings/:listingId`
  - `PATCH /api/seller/listings/:listingId`
  - `POST /api/seller/upload-sessions`
  - `POST /api/seller/listings/:listingId/media`
  - `POST /api/seller/listings/:listingId/publish`
- The first public read APIs are:
  - `GET /api/categories`
  - `GET /api/categories/:categorySlug`
  - `GET /api/listings/:listingId`

## Listing Authoring And Publish Flow

- Sellers can still create a blank draft through `POST /api/seller/listings`, but the create route now also accepts initial listing fields.
- Upload sessions are draft-scoped, not global. `POST /api/seller/upload-sessions` requires a seller-owned `listing_id`, validates the draft is still in `draft` status, and returns direct-to-Spaces `PUT` instructions.
- Asset keys now live under `listings/drafts/{listing_id}/...` so attachment can enforce draft ownership without a separate asset table in this slice.
- `POST /api/seller/listings/:listingId/media` persists attached media rows in `listing_media`, derives stable public URLs from the configured Spaces asset host, and writes audit events for media attachment.
- Draft listings now carry real fixed-price authoring fields: category, title, description, condition code, quantity, and price.
- Trading-card metadata is modeled through seeded category tables instead of hard-coded listing columns:
  - category `cat_cards` / slug `trading-cards`
  - required attributes `grading_company` and `grade`
- `PATCH /api/seller/listings/:listingId` updates core draft fields and category-scoped attribute values.
- `POST /api/seller/listings/:listingId/publish` runs structured validation, enforces seller eligibility, and returns a `422 listing_validation_failed` Problem Details document when the draft is incomplete.
- Published listing reads are public at `GET /api/listings/:listingId`, but only for listings whose status is `published`.

## Key Flows

- `pnpm dev` runs the Turborepo workspace and starts the web app.
- `pnpm db:start` starts the repo-managed PostgreSQL container.
- `pnpm db:migrate` applies Prisma migrations and regenerates the Prisma client for `apps/web`.
- The web app imports its global stylesheet from the shared Tailwind package.
- Seller workspace pages, seller APIs, BetterAuth routes, seeded category metadata, draft publish validation, public listing reads, and the direct-upload media flow now run end-to-end against PostgreSQL plus DigitalOcean Spaces.

## Constraints

- Keep the monorepo shape minimal until real shared product code exists.
- Prefer durable repo-local docs over chat-only context.
- Keep `AGENTS.md` short and use linked docs as the source of truth.
- Development uses `WATCHPACK_POLLING=true` in the app dev script to avoid local `EMFILE` watcher-limit failures in this environment.
