# Testing

## Current Verification Baseline

The repo currently uses build and static analysis checks as its main verification layer:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

## Current State

- There is not yet a dedicated automated test suite.
- The web app is still at the initial scaffold stage.
- Manual verification of the homepage is acceptable for very early UI scaffolding, but that should shrink as real product behavior appears.

## Direction

As CMD Market grows:

- add targeted automated tests alongside real behavior
- keep verification narrow first, then broaden to repo-wide checks
- document any new test commands here when they become part of the expected workflow
