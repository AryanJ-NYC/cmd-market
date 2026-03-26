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

## Manual Verification

- Start PostgreSQL with `pnpm db:start`.
- Apply migrations with `pnpm db:migrate`.
- Run the app with `pnpm dev`.
- Verify:
  - sign-in at `/sign-in`
  - workspace create/select flow at `/seller/workspace`
  - single-workspace auto-activation and multi-workspace POST selection at `/seller/workspace`
  - seller settings and OpenClaw key creation at `/seller/settings`
  - development override only appears outside production and only for allowlisted sellers
  - `GET /api/seller/context`
  - `GET /api/seller/publishability`

## Direction

As CMD Market grows:

- add targeted automated tests alongside real behavior
- keep verification narrow first, then broaden to repo-wide checks
- document any new test commands here when they become part of the expected workflow
