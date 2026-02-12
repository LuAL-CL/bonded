# Digitize worker

Deterministic digitizer that consumes a render `regions.json` manifest and outputs embroidery artifacts.

## Dependency model
- **Core mode (no external installs required):**
  - Uses stdlib-only fallback writer to generate deterministic `.dst` artifact payload.
  - Always emits inspectable `stitch-preview.svg` and direction debug JSON.
  - Core tests run in restricted/offline environments.
- **Enhanced mode (optional deps):**
  - `pyembroidery` enables production DST binary writing.
  - `Pillow` enables optional PNG visual maps.

## Tests
- Core: `python -m unittest services/digitize/src/test_digitize_core.py`
- Visual (optional, auto-skip without Pillow): `python -m unittest services/digitize/src/test_digitize_visual.py`
