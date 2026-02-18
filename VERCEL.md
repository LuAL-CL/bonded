# Vercel Deploy (PR0: deployable demo site mode)

## Goal
Deploy public pages without DB/Redis/payments/workers.

## Required environment variables

Set in Vercel (Production + Preview):

- `NEXT_PUBLIC_DEMO_MODE=true`
- `DEMO_MODE=true`
- `DISABLE_DB=true`
- `DISABLE_JOBS=true`

No `DATABASE_URL` required in this mode.

## Build configuration

- Root directory: `apps/web` (or monorepo root with filtered build)
- Install command: `corepack enable && corepack prepare pnpm@10.4.1 --activate && pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @bonded/web build`
- Node version: `20.x` (matches `.nvmrc` and `package.json` engines)

## Deterministic install notes

- Keep `pnpm-lock.yaml` committed at the repo root.
- Do not use `pnpm install --no-frozen-lockfile` in CI/Vercel.
- If dependencies are changed, regenerate the lockfile locally with the pinned pnpm version and commit it.

## Verify after deploy

1. Landing page renders.
2. Product page `/product/hat` renders.
3. Checkout shows disabled payment message.
4. Admin loads mock data message (no DB dependency).
5. No runtime attempts to connect to Redis/localhost queues.
