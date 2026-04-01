# Testing

## Current Verification Baseline

The repo now uses a mix of targeted behavior tests and repo-level verification:

- `pnpm --filter @cmd-market/web test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

## Seller Coverage

- `apps/web/lib/seller/domain.test.ts` covers seller-account domain rules, eligibility, and manual override policy.
- `apps/web/lib/seller/workspace.test.ts` covers seller workspace routing, safe return-path handling, and OpenClaw key request rules.
- `apps/web/lib/seller/openclaw-authorization-repository.test.ts` covers Prisma persistence for OpenClaw authorization sessions and their audit events.
- `apps/web/lib/seller/service.test.ts` covers seller request-context resolution, OpenClaw authorization-session lifecycle behavior, and publishability across session and API-key paths.
- `apps/web/app/seller/authorize/openclaw/[browserToken]/actions.test.ts` covers the browser handoff actions, including inline first-workspace creation failures and redirects.
- `apps/web/lib/seller/http.test.ts` covers seller response envelopes shared by runtime JSON and OpenAPI generation.
- `apps/web/lib/listing/service.test.ts` covers blank draft creation, draft-scoped upload session creation, media attachment, cross-seller rejection, and duplicate-attachment handling.
- `apps/web/lib/listing/service.draft-publish.test.ts` covers real listing draft fields, seller-owned shipping profile attachment, typed trading-card attributes, category reads, publish validation, and public listing reads.
- `apps/web/lib/listing/domain.test.ts` covers draft publish-validation rules and the Problem Details payload.
- `apps/web/lib/listing/http.test.ts` covers listing response envelopes shared by runtime JSON and OpenAPI generation.
- `apps/web/lib/shipping-profile/service.test.ts` and `apps/web/lib/shipping-profile/http.test.ts` cover seller-owned shipping profile validation, ownership, and shared response envelopes.
- `apps/web/lib/discovery/llms.test.ts` and `apps/web/lib/discovery/openapi.test.ts` cover the generated discovery documents.
- `apps/web/prisma/schema.test.ts` covers the checked-in seller eligibility, listing/media/shipping schema, and seeded category/attribute metadata shape.
- `apps/web/app/_components/landing/content.test.ts` and `apps/web/app/seller/content.test.ts` cover public-surface copy contracts for the homepage and seller entry page.

## Manual Verification

- Start PostgreSQL with `pnpm db:start`.
- Apply migrations with `pnpm db:migrate`.
- Replace the placeholder Spaces constants in `apps/web/lib/storage/spaces.ts`.
- Set `DO_SPACES_ACCESS_KEY_ID` and `DO_SPACES_SECRET_ACCESS_KEY` in `apps/web/.env`.
- Run the app with `pnpm dev`.
- Verify:
  - homepage at `/` shows a visible `For agents` quickstart and explicit seller/auth boundary copy
  - seller entry page at `/seller` explains the browser flow and links to `/sign-in`, `/seller/workspace`, and `/seller/settings`
  - `/llms.txt` and `/openapi.json` are both reachable and describe the same current route surface
  - sign-in at `/sign-in`
  - workspace create/select flow at `/seller/workspace`
  - single-workspace auto-activation and multi-workspace POST selection at `/seller/workspace`
  - OpenClaw browser handoff create/poll/redeem flow works end-to-end through `/api/openclaw/authorization-sessions*` with PKCE `code_challenge` and `code_verifier` payloads instead of a shared bearer secret
  - the consent screen at `/seller/authorize/openclaw/:browserToken` handles sign-in redirects, inline first-workspace creation, workspace redirects, approval, rejection, and terminal states
  - seller settings and manual OpenClaw key creation still work at `/seller/settings`
  - development override only appears outside production and only for allowlisted sellers
  - `GET /api/seller/context`
  - `GET /api/seller/publishability`
  - `POST /api/seller/shipping-profiles` creates a reusable flat domestic shipping profile
  - `GET /api/seller/shipping-profiles` lists the seller-owned shipping profiles for the current seller context
  - `POST /api/seller/listings` returns a `draft` listing and still accepts an empty `{}` body
  - `POST /api/seller/listings` and `PATCH /api/seller/listings/:listingId` accept `shipping_profile_id`
  - seller listing responses include both `shipping_profile_id` and the normalized `shipping` summary
  - `GET /api/categories`
  - `GET /api/categories/trading-cards`
  - `POST /api/seller/upload-sessions` accepts `listing_id` plus image descriptors and returns presigned Spaces `PUT` instructions
  - uploading to the presigned URL succeeds with the returned `content-type` header
  - `POST /api/seller/listings/:listingId/media` attaches uploaded assets and returns public media URLs
  - `PATCH /api/seller/listings/:listingId` stores trading-card base fields plus `grading_company` and `grade`
  - `POST /api/seller/listings/:listingId/publish` returns `422 listing_validation_failed` for incomplete drafts
  - `POST /api/seller/listings/:listingId/publish` succeeds after required media and trading-card fields are present
  - `GET /api/listings/:listingId` returns `404` before publish and a canonical public listing with normalized flat domestic shipping after publish
  - the draft/upload/attach flow works once with a browser session and once with `x-api-key`

## Direction

As CMD Market grows:

- keep docs and discovery clear that CMD Market is multi-agent by product direction even when a specific implementation slice is still OpenClaw-specific
- add targeted automated tests alongside real behavior
- keep verification narrow first, then broaden to repo-wide checks
- document any new test commands here when they become part of the expected workflow
