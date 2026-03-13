# CMD Market Documentation System Design

**Date:** 2026-03-13

## Summary

Create a harness-style documentation system for CMD Market where the repository is the source of truth, `AGENTS.md` is a short routing layer, and durable knowledge is separated from scratch planning output.

## Goals

- Support both humans and coding agents with progressive disclosure.
- Keep root docs short and high signal.
- Preserve durable decisions while avoiding documentation sprawl.
- Define explicit places for active plans, archived plans, references, and scratch material.

## Documentation Model

The repository will use a layered system:

- `README.md` for quick human onboarding
- `AGENTS.md` for agent routing
- `ARCHITECTURE.md` for durable technical structure
- `docs/` for product, development, testing, plans, and references

This follows a harness-style principle: entrypoint docs should route readers to the correct source of truth instead of duplicating everything inline.

## Promotion Rules

- Durable product truth belongs in `docs/product.md`.
- Durable engineering truth belongs in `ARCHITECTURE.md`, `docs/development.md`, or `docs/testing.md`.
- Significant in-progress work belongs in `docs/plans/active/`.
- Completed plans are kept only when they preserve lasting decisions worth revisiting.
- Scratch notes, temporary research, and AI exhaust should not be committed.

## Repository Layout

- `README.md`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/index.md`
- `docs/product.md`
- `docs/development.md`
- `docs/testing.md`
- `docs/plans/active/README.md`
- `docs/plans/completed/README.md`
- `docs/references/README.md`

## `.gitignore` Rules

Durable docs stay tracked by default. Only explicit scratch zones are ignored:

- `docs/tmp/`
- `docs/plans/drafts/`
- `docs/references/raw/`
- `*.scratch.md`

## Existing Plan Cleanup

The current scaffold planning docs should be normalized under the new system:

- keep at most one scaffold plan as a durable historical record
- move durable scaffold truths into `ARCHITECTURE.md` and `docs/development.md`
- remove redundant scaffold planning files

## Verification

- Verify the required doc files and directories exist
- Verify `AGENTS.md` links resolve to real files
- Verify the scaffold plan has been normalized into the completed-plans flow
- Verify `.gitignore` contains the explicit scratch zones

## Notes

This directory is not currently a git repository, so the design is stored locally without a commit.
