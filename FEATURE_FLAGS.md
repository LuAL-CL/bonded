# Feature Flags (PR0)

This project supports deploy-safe flags to avoid runtime connections in restricted environments.

## Flags

- `NEXT_PUBLIC_DEMO_MODE=true`
  - Public demo UX mode.
  - Disables checkout/payment actions.
- `DEMO_MODE=true`
  - Server-side demo mode.
  - Implies DB/jobs safe behavior.
- `DISABLE_DB=true`
  - Disables Prisma runtime usage.
  - Admin page/routes return mock data.
- `DISABLE_JOBS=true`
  - Disables Redis/BullMQ runtime usage.
  - No queue/worker creation.
  - Enqueue functions become no-ops.

## Priority behavior

- `DEMO_MODE=true` effectively disables DB and jobs behavior paths.
- `DISABLE_DB=true` can be used independently to hard-disable Prisma.
- `DISABLE_JOBS=true` can be used independently to hard-disable queues/workers.
