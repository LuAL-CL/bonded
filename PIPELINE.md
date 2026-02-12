# Pipeline Versioning

## v1.2.0

1. Canonicalization:
   - Apply EXIF orientation.
   - Resize longest side to 1024.
   - Encode PNG.
   - Compute `canonical_hash = sha256(canonical_png_bytes)`.
2. Deterministic pet extraction:
   - Pet/background mask by deterministic color-distance + edge scoring.
   - Morphological close and deterministic bounding-box crop.
3. Identity-preserving abstraction:
   - Preserve high-contrast facial structures via contour stage.
   - Quantize pet palette to <=8 colors (needle budget aware).
4. Needle budgeting:
   - Total needles = 10; 2 reserved for diamond frame.
   - Pet artwork capped at 8 needles with feature-priority tone merging when over capacity.
5. Debug outputs at render stage:
   - segmentation mask PNG
   - contour extraction PNG
   - palette map PNG
   - region classification PNG
   - stitch direction map PNG
   - regions manifest JSON
6. Digitizing:
   - Region classification drives fill vs satin planning.
   - Underlay + tie-in/tie-off + pull compensation.
   - Clamp stitch lengths and limit jump/trim behavior.
7. Debug outputs at digitize stage:
   - always: stitch simulation SVG + stitch-direction JSON
   - optional: stitch-direction PNG (when Pillow available)
8. QA and status transitions:
   - Validate needle/color limits and stitch/jump/trim metrics.
   - Order progression: `PAID` -> `ASSETS_GENERATED` or `NEEDS_REVIEW`.
