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
- Build command: `npm run build` (in `apps/web`) or `pnpm --filter @bonded/web build`

## Verify after deploy

1. Landing page renders.
2. Product page `/product/hat` renders.
3. Checkout shows disabled payment message.
4. Admin loads mock data message (no DB dependency).
5. No runtime attempts to connect to Redis/localhost queues.
