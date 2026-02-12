# Digitizing Guide (v1.2)

## Needle capacity constraints
- Total machine needles: **10**
- Reserved for fixed diamond frame: **2**
- Pet artwork budget: **max 8 needles** (target typically 6–8)
- Side logo should reuse black/white from available palette whenever possible.

## Parameters
- Fill density: 0.42 mm
- Satin density: 0.38 mm
- Pull compensation: 0.25 mm
- Max stitch length: 4.0 mm
- Max jump length: 6.0 mm

## Planning rules
- Region class `fill` => directional fill lines with angle bias.
- Region class `outline|feature` => satin-style rails with pull compensation.
- Always apply underlay before top stitches.
- Insert tie-in at region start and trim/tie-off at region end.
- Clamp overlong stitches deterministically.
- Enforce pet needle capacity (<=8) by intelligent tone merging prioritizing feature/contrast regions.

## Debug outputs
- Always available (no Pillow required):
  - `stitch-preview.svg`
  - `digitize-stitch-direction-map.json`
- Optional (Pillow installed):
  - `digitize-stitch-direction-map.png`
