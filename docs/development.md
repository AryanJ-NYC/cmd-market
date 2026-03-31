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
- Local PostgreSQL defaults to `postgres://postgres:postgres@127.0.0.1:5433/cmd_market` for both `NEON_DATABASE_URL` and `NEON_DATABASE_URL_UNPOOLED`.
- `apps/web/lib/env.ts` validates server env with `@t3-oss/env-nextjs`.
- Better Auth resolves its base URL dynamically from the request host and only allows `localhost:*`, `*.vercel.app`, `cmd.market`, `www.cmd.market`, and `testnet.cmd.market`.
- `BETTER_AUTH_SECRET`, `NEON_DATABASE_URL`, `X_CLIENT_ID`, `X_CLIENT_SECRET`, `DO_SPACES_ACCESS_KEY_ID`, and `DO_SPACES_SECRET_ACCESS_KEY` are required in every environment where the app boots.
- Prisma CLI uses `NEON_DATABASE_URL_UNPOOLED` for migrations and schema validation.

## DigitalOcean Spaces Setup

- Replace the placeholder constants in `apps/web/lib/storage/spaces.ts`:
  - `SPACES_REGION`
  - `SPACES_BUCKET`
  - `SPACES_PUBLIC_BASE_URL`
- Create a DigitalOcean Spaces access key with read/write access to the target Space.
- Put these secrets in `apps/web/.env` and Vercel:
  - `DO_SPACES_ACCESS_KEY_ID`
  - `DO_SPACES_SECRET_ACCESS_KEY`
- Configure Space CORS with:
  - origins: `http://localhost:3000`, `https://cmd.market`, `https://www.cmd.market`, `https://testnet.cmd.market`
  - methods: `PUT`, `GET`, `HEAD`
  - allowed headers: `Content-Type`

## Commands

- `pnpm install`
- `pnpm db:start`
- `pnpm db:stop`
- `pnpm db:generate`
- `pnpm db:deploy`
- `pnpm db:migrate`
- `pnpm dev`
- `pnpm build`
- `pnpm vercel-build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

## Seller Workspace Slice

- BetterAuth is mounted at `/api/auth/*`.
- Seller APIs live at:
  - `GET /api/seller/context`
  - `GET /api/seller/publishability`
  - `POST /api/seller/listings`
  - `GET /api/seller/listings/:listingId`
  - `PATCH /api/seller/listings/:listingId`
  - `POST /api/seller/upload-sessions`
  - `POST /api/seller/listings/:listingId/media`
  - `POST /api/seller/listings/:listingId/publish`
- Public listing APIs live at:
  - `GET /api/categories`
  - `GET /api/categories/:categorySlug`
  - `GET /api/listings/:listingId`
- Seller UI entry points live at:
  - `/seller`
  - `/sign-in`
  - `/seller/workspace`
  - `/seller/settings`
- Public discovery entry points live at:
  - `/`
  - `/llms.txt`
  - `/openapi.json`
- OpenClaw authorization is currently limited to one organization-owned API key per seller workspace.
- Development eligibility override is ignored in production, even if `DEV_SELLER_OVERRIDE_EMAILS` is set.
- Seller API keys authenticate seller API routes only. Browser seller UI still requires a browser session.
- Draft upload sessions are listing-scoped and currently expect a `listing_id` plus image file descriptors.
- Trading-card authoring currently uses one seeded category:
  - `cat_cards`
  - slug `trading-cards`
  - required attributes `grading_company` and `grade`

## Database Workflow

- Schema source of truth: `apps/web/prisma/schema.prisma`
- Prisma config: `apps/web/prisma.config.ts`
- Generated SQL migrations: `apps/web/prisma/migrations/`
- Deploy-safe migration command: `pnpm db:deploy`
- Use `pnpm db:migrate` after schema changes instead of hand-writing SQL migrations.
- The Prisma client is regenerated on install through the root `postinstall` hook, and can be regenerated manually with `pnpm db:generate`.
- Vercel runs `pnpm vercel-build`, which applies `prisma migrate deploy` before `pnpm build`.
- If an older local PostgreSQL volume reports Prisma drift from pre-reset seller-account migrations, reset that local dev database once with `pnpm db:stop`, then `pnpm db:start`, then rerun `pnpm db:migrate`.

## Listing Authoring API Flow

1. Create a blank draft listing:
   ```bash
   curl -X POST http://localhost:3000/api/seller/listings \
     -H "x-api-key: <seller-api-key>" \
     -H "content-type: application/json" \
     -d '{}'
   ```
   You can also seed the draft with initial fields:
   ```bash
   curl -X POST http://localhost:3000/api/seller/listings \
     -H "x-api-key: <seller-api-key>" \
     -H "content-type: application/json" \
     -d '{
       "category_id": "cat_cards",
       "title": "1999 Charizard Holo PSA 8",
       "description": "Clean slab, no cracks, centered well.",
       "condition_code": "used_good",
       "quantity_available": 1,
       "price": {
         "amount_minor": 125000,
         "currency_code": "USD"
       }
     }'
   ```
2. Request draft-scoped upload sessions:
   ```bash
   curl -X POST http://localhost:3000/api/seller/upload-sessions \
     -H "x-api-key: <seller-api-key>" \
     -H "content-type: application/json" \
     -d '{
       "listing_id": "lst_123",
       "files": [
         {
           "filename": "front.jpg",
           "content_type": "image/jpeg",
           "size_bytes": 2488331
         }
       ]
     }'
   ```
3. Upload the file bytes directly to Spaces with the returned presigned `PUT` URL and `content-type` header.
4. Attach the uploaded asset to the draft:
   ```bash
   curl -X POST http://localhost:3000/api/seller/listings/lst_123/media \
     -H "x-api-key: <seller-api-key>" \
     -H "content-type: application/json" \
     -d '{
       "media": [
         {
           "asset_key": "listings/drafts/lst_123/asset_123-front.jpg"
         }
       ]
     }'
   ```
   `alt_text` is optional, and `sort_order` is optional. If you omit `sort_order`, CMD Market defaults it from the media array order.
5. Discover the current category metadata before patching attributes:
   ```bash
   curl http://localhost:3000/api/categories/trading-cards
   ```
6. Patch the draft with trading-card fields and attributes:
   ```bash
   curl -X PATCH http://localhost:3000/api/seller/listings/lst_123 \
     -H "x-api-key: <seller-api-key>" \
     -H "content-type: application/json" \
     -d '{
       "title": "1999 Charizard Holo PSA 8",
       "description": "Clean slab, no cracks, centered well.",
       "condition_code": "used_good",
       "quantity_available": 1,
       "price": {
         "amount_minor": 125000,
         "currency_code": "USD"
       },
       "attributes": [
         {
           "key": "grading_company",
           "value": "psa"
         },
         {
           "key": "grade",
           "value": 8
         }
       ]
     }'
   ```
7. Publish the draft:
   ```bash
   curl -X POST http://localhost:3000/api/seller/listings/lst_123/publish \
     -H "x-api-key: <seller-api-key>"
   ```
   If the draft is incomplete, this route returns a `422` Problem Details response with `code: "listing_validation_failed"` and a field-level `errors` array.
8. Read the canonical public listing:
   ```bash
   curl http://localhost:3000/api/listings/lst_123
   ```

## Current Conventions

- Keep the repo small until real shared product code exists.
- Put durable technical truth in `ARCHITECTURE.md` and focused docs under `docs/`.
- Keep `AGENTS.md` short and index-like.
- Prefer explicit workspace packages for shared config over ad hoc duplication.

## Documentation System

This repo follows a harness-style progressive disclosure model:

- `README.md` and `AGENTS.md` are entrypoints
- `apps/web/app/llms.txt/route.ts` serves generated LLM and agent guidance at `/llms.txt`
- `apps/web/app/openapi.json/route.ts` serves the generated current API description at `/openapi.json`
- `apps/web/lib/discovery/content.ts` is the shared source of truth for route intent and linked discovery docs
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
