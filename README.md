# bonded.cl monorepo

Production-grade scaffold for deterministic custom embroidered pet hats in Chile.

## Structure
- `apps/web`: Next.js API surface + orchestration producers + worker entrypoints.
- `services/render`: deterministic pet detection/segmentation, palette quantization, identity-preserving contour extraction, embroidery-style preview generation.
- `services/digitize`: deterministic DST generation with region-aware stitch planning and QA artifacts.
- `packages/shared`: versioned pipeline config, hashing, schemas and status enums.

## Needle/Color policy
- Physical needle limit: 10
- 2 needles reserved for fixed diamond frame
- Pet artwork constrained to 6–8 colors typically (hard cap 8)
- If palette exceeds budget, tone merge prioritizes identity-critical features (eyes, nose, key fur contrast)

## Debug outputs per customization
Render stage writes:
- `segmentation-mask.png`
- `contour.png`
- `palette-map.png`
- `region-classification.png`
- `stitch-direction-map.png`
- `regions.json`

Digitize stage writes (always):
- `stitch-preview.svg`
- `digitize-stitch-direction-map.json`

Digitize stage writes (optional if Pillow available):
- `digitize-stitch-direction-map.png`

## Offline/restricted testing
Core digitizer tests run with zero external installs:
- `python -m unittest services/digitize/src/test_digitize_core.py`

Optional visual tests auto-skip when Pillow is missing:
- `python -m unittest services/digitize/src/test_digitize_visual.py`

## Deploy to Vercel in demo mode
Use this when you want a deploy with **no DB, no payments, and no workers**.

### 1) Import the repo in Vercel
- Project root: `apps/web`
- Framework preset: Next.js

### 2) Set environment variables in Vercel
Set these exact values for Production/Preview:
- `NEXT_PUBLIC_DEMO_MODE=true`
- `DEMO_MODE=true`

No `DATABASE_URL` is required in demo mode.

### 3) Deploy
- Trigger deploy (or push to main).
- In demo mode behavior:
  - Checkout page shows: `Payment disabled in demo`.
  - Payment API routes return disabled mock responses.
  - DB-backed admin/order routes return mock data.
  - Prisma is not initialized.

### 4) Local demo build command
From `apps/web`:
- `NEXT_PUBLIC_DEMO_MODE=true DEMO_MODE=true npm run build`

## PR0 deployment hard gates
- See `FEATURE_FLAGS.md` for runtime flags (`DISABLE_DB`, `DISABLE_JOBS`, demo flags).
- See `VERCEL.md` for deploy-safe Vercel settings and verification checklist.
