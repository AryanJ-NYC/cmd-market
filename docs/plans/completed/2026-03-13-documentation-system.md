# CMD Market Documentation System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish a harness-style documentation system for CMD Market with short entrypoints, durable source-of-truth docs, explicit plan folders, and scratch-only ignore rules.

**Architecture:** Keep `README.md` and `AGENTS.md` concise, move durable knowledge into focused repo-local docs, and normalize planning artifacts into active/completed folders. Preserve only one durable scaffold plan record and ignore scratch documentation zones explicitly rather than broadly ignoring docs.

**Tech Stack:** Markdown, `.gitignore`, Turborepo workspace conventions

---

### Task 1: Create root documentation entrypoints

**Files:**
- Create: `README.md`
- Create: `AGENTS.md`
- Create: `ARCHITECTURE.md`

**Step 1: Write `README.md`**

Describe CMD Market, the current repo state, and the main workspace commands.

**Step 2: Write `AGENTS.md`**

Keep it short and route agents to repo-local source-of-truth docs.

**Step 3: Write `ARCHITECTURE.md`**

Capture the current app/package shape, boundaries, flows, and constraints.

**Step 4: Verify the root docs exist**

Run: `ls README.md AGENTS.md ARCHITECTURE.md`
Expected: all three files exist

### Task 2: Create the durable docs map

**Files:**
- Create: `docs/index.md`
- Create: `docs/product.md`
- Create: `docs/development.md`
- Create: `docs/testing.md`
- Create: `docs/plans/active/README.md`
- Create: `docs/plans/completed/README.md`
- Create: `docs/references/README.md`

**Step 1: Create the docs index**

Add a short map explaining what each durable doc is for.

**Step 2: Write product guidance**

Capture CMD Market’s current product concept, actors, and marketplace advantages from the approved product description.

**Step 3: Write development guidance**

Capture workspace commands, current conventions, and the documentation promotion rules.

**Step 4: Write testing guidance**

Capture the current verification baseline and how testing expectations should evolve.

**Step 5: Add placeholder README files**

Create visible entrypoints for active plans, completed plans, and references.

**Step 6: Verify the docs map**

Run: `find docs -maxdepth 3 -type f | sort`
Expected: the doc map files and folder README files are present

### Task 3: Normalize existing planning artifacts

**Files:**
- Move: `docs/plans/2026-03-13-cmd-market-scaffold.md` to `docs/plans/completed/2026-03-13-initial-scaffold.md`
- Delete: `docs/plans/2026-03-13-cmd-market-scaffold-design.md`
- Move: `docs/plans/2026-03-13-documentation-system-design.md` to `docs/plans/completed/2026-03-13-documentation-system-design.md`
- Move: `docs/plans/2026-03-13-documentation-system.md` to `docs/plans/completed/2026-03-13-documentation-system.md`

**Step 1: Keep one scaffold historical record**

Preserve the scaffold implementation plan as the single durable scaffold planning artifact.

**Step 2: Remove the redundant scaffold design note**

Delete the duplicate scaffold design doc after its durable truths are absorbed by the new durable docs.

**Step 3: Archive the documentation-system design and plan**

Move the new design and implementation plan into the completed plans folder because they capture lasting repo rules.

**Step 4: Verify the plans layout**

Run: `find docs/plans -maxdepth 3 -type f | sort`
Expected: active/completed folder READMEs exist, one scaffold plan remains, and the documentation-system docs are archived

### Task 4: Update ignore rules and verify structure

**Files:**
- Modify: `.gitignore`

**Step 1: Add explicit scratch zones**

Append the ignored scratch doc paths:

```gitignore
docs/tmp/
docs/plans/drafts/
docs/references/raw/
*.scratch.md
```

**Step 2: Verify AGENTS links conceptually resolve**

Run: `rg --files README.md AGENTS.md ARCHITECTURE.md docs`
Expected: all files referenced by `AGENTS.md` exist in the repo

**Step 3: Re-read the new-repo-agents checklist**

Confirm the required structure exists and `AGENTS.md` remains short.

**Step 4: Note repository constraints**

Record that this repo is still not a git repository, so no commit step is included.
