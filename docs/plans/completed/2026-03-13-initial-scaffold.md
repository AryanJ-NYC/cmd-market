# CMD Market Initial Scaffold Plan

Archived as the single durable planning record for the initial repository scaffold.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a minimal Turborepo workspace with a single Next.js app wired to Tailwind and a boilerplate-free homepage.

**Architecture:** Build the repo manually instead of generating and pruning a template. Keep one app in `apps/web`, centralize reusable TypeScript config in `packages/*`, keep Tailwind shared through a workspace stylesheet package, and verify the setup through install, build, and a minimal homepage render.

**Tech Stack:** `pnpm`, `turbo`, `next`, `react`, `typescript`, `tailwindcss`, `postcss`, `eslint`

---

### Task 1: Create the monorepo root

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`

**Step 1: Create the workspace manifest**

Add a root `package.json` with workspace scripts:

```json
{
  "name": "cmd-market",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "<latest>"
  }
}
```

**Step 2: Add workspace discovery**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
```

**Step 3: Add the Turbo pipeline**

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

**Step 4: Ignore generated files**

Create `.gitignore`:

```gitignore
node_modules
.turbo
.next
dist
pnpm-lock.yaml
```

**Step 5: Verify file shape**

Run: `ls -la package.json pnpm-workspace.yaml turbo.json .gitignore`
Expected: all four files exist at repo root

### Task 2: Create shared config packages

**Files:**
- Create: `packages/typescript-config/package.json`
- Create: `packages/typescript-config/base.json`
- Create: `packages/typescript-config/nextjs.json`
- Create: `packages/tailwind-config/package.json`
- Create: `packages/tailwind-config/styles.css`

**Step 1: Create the TypeScript config package**

Add `packages/typescript-config/package.json`:

```json
{
  "name": "@cmd-market/typescript-config",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json", "nextjs.json"]
}
```

**Step 2: Add the shared base TS config**

Create `packages/typescript-config/base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

**Step 3: Add the Next.js TS config**

Create `packages/typescript-config/nextjs.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "noEmit": true,
    "incremental": true,
    "jsx": "preserve",
    "plugins": [{ "name": "next" }]
  }
}
```

**Step 4: Create the Tailwind config package**

Add `packages/tailwind-config/package.json` and `packages/tailwind-config/styles.css` so the web app can import shared Tailwind CSS from one place while keeping PostCSS config local to the Next.js app.

**Step 5: Verify package files**

Run: `rg --files packages`
Expected: the shared config files are listed

### Task 3: Create the web app

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next-env.d.ts`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/eslint.config.mjs`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`

**Step 1: Create the app manifest**

Add `apps/web/package.json` with scripts for `dev`, `build`, `lint`, and `typecheck`, plus dependencies on Next.js, React, Tailwind, and the shared config packages.

**Step 2: Add TypeScript wiring**

Create `apps/web/tsconfig.json` extending `@cmd-market/typescript-config/nextjs.json`, and add the standard `next-env.d.ts`.

**Step 3: Add framework configuration**

Create `apps/web/next.config.ts` and `apps/web/eslint.config.mjs` with only the minimal Next.js setup needed for a clean app.

**Step 4: Add Tailwind wiring**

Create `apps/web/postcss.config.mjs` locally in the app using `@tailwindcss/postcss`, and create `apps/web/app/globals.css` with:

```css
@import "@cmd-market/tailwind-config/styles.css";
```

**Step 5: Add the minimal app shell**

Create `apps/web/app/layout.tsx` with the root HTML structure and import `globals.css`.

**Step 6: Add the proof homepage**

Create `apps/web/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-red-50">
      Hello, World!
    </main>
  );
}
```

**Step 7: Verify the app tree**

Run: `rg --files apps/web`
Expected: the app files are present without demo assets or sample routes

### Task 4: Install and verify

**Files:**
- Modify: `pnpm-lock.yaml` after install

**Step 1: Install dependencies**

Run: `pnpm install`
Expected: install completes successfully and creates `pnpm-lock.yaml`

**Step 2: Verify production build**

Run: `pnpm build`
Expected: Turbo runs the web build successfully

**Step 3: Verify lint**

Run: `pnpm lint`
Expected: lint completes successfully

**Step 4: Verify type checking**

Run: `pnpm typecheck`
Expected: type checking completes successfully

**Step 5: Verify the homepage manually**

Run: `pnpm dev`
Expected: the app starts locally and `/` shows only `Hello, World!` on a red-tinted background

### Task 5: Record repository constraints

**Files:**
- Modify: `docs/plans/2026-03-13-cmd-market-scaffold.md`

**Step 1: Note git status**

Record that the directory is not yet a git repository, so commit steps are intentionally omitted.

**Step 2: Reconfirm scope**

Verify there are no placeholder assets, demo routes, or sample components left behind.

**Step 3: Record the dev watcher workaround**

Document that the app dev script uses `WATCHPACK_POLLING=true` to avoid local `EMFILE` watch-limit failures in this environment.
