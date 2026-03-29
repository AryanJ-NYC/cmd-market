# Testing

## Current Verification Baseline

The repo now uses a mix of targeted behavior tests and repo-level verification:

- `pnpm --filter @cmd-market/web test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

## Seller Coverage

- `apps/web/lib/seller/domain.test.ts` covers seller-account domain rules, eligibility, and manual override policy.
- `apps/web/lib/seller/workspace.test.ts` covers seller workspace routing and OpenClaw key request rules.
- `apps/web/lib/seller/service.test.ts` covers seller request-context resolution and publishability behavior across session and API-key paths.
- `apps/web/lib/listing/service.test.ts` covers thin draft creation, draft-scoped upload session creation, media attachment, cross-seller rejection, and duplicate-attachment handling.
- `apps/web/prisma/schema.test.ts` covers the checked-in seller eligibility and listing/media Prisma schema shape.

## Manual Verification

- Start PostgreSQL with `pnpm db:start`.
- Apply migrations with `pnpm db:migrate`.
- Replace the placeholder Spaces constants in `apps/web/lib/storage/spaces.ts`.
- Set `DO_SPACES_ACCESS_KEY_ID` and `DO_SPACES_SECRET_ACCESS_KEY` in `apps/web/.env`.
- Run the app with `pnpm dev`.
- Verify:
  - sign-in at `/sign-in`
  - workspace create/select flow at `/seller/workspace`
  - single-workspace auto-activation and multi-workspace POST selection at `/seller/workspace`
  - seller settings and OpenClaw key creation at `/seller/settings`
  - development override only appears outside production and only for allowlisted sellers
  - `GET /api/seller/context`
  - `GET /api/seller/publishability`
  - `POST /api/seller/listings` returns a blank `draft` listing
  - `POST /api/seller/upload-sessions` accepts `listing_id` plus image descriptors and returns presigned Spaces `PUT` instructions
  - uploading to the presigned URL succeeds with the returned `content-type` header
  - `POST /api/seller/listings/:listingId/media` attaches uploaded assets and returns public media URLs
  - the draft/upload/attach flow works once with a browser session and once with `x-api-key`

## Direction

As CMD Market grows:

- add targeted automated tests alongside real behavior
- keep verification narrow first, then broaden to repo-wide checks
- document any new test commands here when they become part of the expected workflow
