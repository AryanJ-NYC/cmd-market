# AGENTS.md

## Purpose

Use this file as the agent entrypoint for this repository. Keep it short. Treat the linked docs as the source of truth.

## How To Use This File

- Start here to find the right repo-local guidance.
- Follow deeper docs before making non-trivial changes.
- If guidance grows beyond table-of-contents size, move it into a linked doc and keep this file concise.

## Source of Truth

- `ARCHITECTURE.md`: system shape, packages, runtime boundaries, and key flows.
- `apps/web/docs/design.md`: durable web visual system, voice, and UI composition rules.
- `docs/index.md`: documentation map and ownership of deeper guidance.
- `docs/audience.md`: audience hierarchy, personas, and messaging priorities.
- `docs/product.md`: product goals, user expectations, and scope.
- `docs/development.md`: setup, commands, local workflows, and doc rules.
- `docs/testing.md`: verification strategy, commands, and testing expectations.
- `docs/plans/active/README.md`: in-progress implementation plans.
- `docs/plans/completed/README.md`: completed plans and archived design work with lasting value.
- `docs/references/README.md`: durable external references converted into repo-local notes.

## Task Routing

- Product or scope questions: start with `docs/product.md`.
- Audience or persona questions: start with `docs/audience.md`.
- Design system, landing page, or visual language work: start with `apps/web/docs/design.md`.
- Structural or system changes: start with `ARCHITECTURE.md`.
- Local setup, commands, or workflows: start with `docs/development.md`.
- Verification, regressions, or test additions: start with `docs/testing.md`.
- New implementation planning: write in `docs/plans/active/`.

## Verification Entry Points

- Run the narrowest checks that prove the touched area first.
- Broaden to repo-level verification before claiming completion.
- Record exact commands and outcomes in the final handoff.

## Freshness Rules

- Update the linked source-of-truth docs when behavior or structure changes.
- If routes, auth boundaries, or the public API surface change, update `docs/development.md`, `docs/testing.md`, and the discovery sources in `apps/web/lib/discovery/`.
- Treat `/llms.txt` and `/openapi.json` as generated outputs: update their source modules and schemas, not hand-maintained copies.
- If the repo entrypoint or current shipped scope changes materially, refresh `README.md`.
- Keep this file index-like; do not turn it into the manual.
