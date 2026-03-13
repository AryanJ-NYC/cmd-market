# Development

## Workspace

- Package manager: `pnpm`
- Monorepo runner: `turbo`
- App framework: Next.js App Router
- Styling: Tailwind CSS v4

## Commands

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`

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
