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
