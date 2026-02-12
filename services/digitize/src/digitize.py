from dataclasses import dataclass, asdict
from hashlib import sha256
from pathlib import Path
from typing import List, Tuple, Dict, Any
import argparse
import json
import math

try:
    from PIL import Image, ImageDraw  # optional visual dependency
    PIL_AVAILABLE = True
except Exception:
    PIL_AVAILABLE = False

try:
    from pyembroidery import EmbPattern, STITCH, JUMP, TRIM, COLOR_CHANGE, END, write_dst
    PYEMBROIDERY_AVAILABLE = True
except Exception:
    PYEMBROIDERY_AVAILABLE = False
    STITCH, JUMP, TRIM, COLOR_CHANGE, END = 0, 1, 2, 3, 4

    class EmbPattern:  # fallback minimal pattern for offline environments
        def __init__(self):
            self.stitches: List[Tuple[float, float, int]] = []
            self.threadlist: List[Dict[str, str]] = []
            self._x = 0.0
            self._y = 0.0

        def add_stitch_absolute(self, cmd: int, x: float, y: float):
            self._x, self._y = x, y
            self.stitches.append((x, y, cmd))

        def add_stitch_relative(self, cmd: int, dx: float, dy: float):
            self._x += dx
            self._y += dy
            self.stitches.append((self._x, self._y, cmd))

        def add_command(self, cmd: int):
            self.stitches.append((self._x, self._y, cmd))

    def write_dst(pattern: EmbPattern, out_dst: str):
        # deterministic fallback artifact when pyembroidery is unavailable
        payload = {
            "format": "DST_FALLBACK",
            "stitch_count": len(pattern.stitches),
            "thread_count": len(pattern.threadlist),
            "stitches": [[round(x, 2), round(y, 2), c] for x, y, c in pattern.stitches[:5000]],
        }
        Path(out_dst).write_text(json.dumps(payload, separators=(",", ":"), sort_keys=True))


MM_TO_DST = 10
FRAME_RESERVED_NEEDLES = 2
TOTAL_NEEDLES = 10
PET_MAX_NEEDLES = TOTAL_NEEDLES - FRAME_RESERVED_NEEDLES  # 8 max for pet artwork


@dataclass(frozen=True)
class DigitizeConfig:
    fill_density_mm: float = 0.42
    satin_density_mm: float = 0.38
    pull_comp_mm: float = 0.25
    max_stitch_mm: float = 4.0
    max_jump_mm: float = 6.0


def mm_to_dst(mm: float) -> int:
    return max(1, int(round(mm * MM_TO_DST)))


def to_hex_thread(color_hex: str) -> Dict[str, str]:
    return {"hex": color_hex}


def add_safe_stitch(pattern: EmbPattern, x0: float, y0: float, x1: float, y1: float, max_stitch: float):
    dx = x1 - x0
    dy = y1 - y0
    dist = math.sqrt(dx * dx + dy * dy)
    if dist <= max_stitch:
        pattern.add_stitch_absolute(STITCH, x1, y1)
        return
    segments = max(1, int(math.ceil(dist / max_stitch)))
    for i in range(1, segments + 1):
        xi = x0 + dx * (i / segments)
        yi = y0 + dy * (i / segments)
        pattern.add_stitch_absolute(STITCH, xi, yi)


def add_underlay(pattern: EmbPattern, poly: List[Tuple[float, float]], region_type: str):
    if not poly:
        return
    pattern.add_stitch_absolute(STITCH, poly[0][0], poly[0][1])
    step = 2 if region_type == "feature" else 1
    for i in range(0, len(poly), step):
        x, y = poly[i]
        pattern.add_stitch_absolute(STITCH, x, y)


def fill_region(pattern: EmbPattern, poly: List[Tuple[float, float]], angle_deg: float, density_mm: float, max_stitch_mm: float):
    if len(poly) < 4:
        return
    x_min = min(p[0] for p in poly)
    x_max = max(p[0] for p in poly)
    y_min = min(p[1] for p in poly)
    y_max = max(p[1] for p in poly)
    spacing = mm_to_dst(density_mm)
    theta = math.radians(angle_deg)
    dx = math.cos(theta)
    dy = math.sin(theta)

    line_count = max(1, int((y_max - y_min) / max(1, spacing)))
    for i in range(line_count + 1):
        y = y_min + i * spacing
        if i % 2 == 0:
            add_safe_stitch(pattern, x_min, y, x_max, y, mm_to_dst(max_stitch_mm))
        else:
            add_safe_stitch(pattern, x_max, y, x_min, y, mm_to_dst(max_stitch_mm))
        pattern.add_stitch_relative(STITCH, dx * 1.2, dy * 1.2)


def satin_region(pattern: EmbPattern, poly: List[Tuple[float, float]], pull_comp_mm: float, max_stitch_mm: float):
    if len(poly) < 4:
        return
    x_min = min(p[0] for p in poly)
    x_max = max(p[0] for p in poly)
    y_min = min(p[1] for p in poly)
    y_max = max(p[1] for p in poly)
    pull = mm_to_dst(pull_comp_mm)
    step = max(2, int((y_max - y_min) / 20))
    for y in range(int(y_min), int(y_max) + 1, step):
        add_safe_stitch(pattern, x_min - pull, y, x_max + pull, y, mm_to_dst(max_stitch_mm))


def tie_in(pattern: EmbPattern, x: float, y: float):
    pattern.add_stitch_absolute(STITCH, x, y)
    pattern.add_stitch_relative(STITCH, 1, 0)
    pattern.add_stitch_relative(STITCH, -1, 0)


def tie_off(pattern: EmbPattern):
    pattern.add_command(TRIM)


def classify_region(region_type: str) -> str:
    return "satin" if region_type in {"feature", "outline"} else "fill"


def enforce_needle_capacity(regions: List[dict]) -> List[dict]:
    grouped: Dict[str, List[dict]] = {}
    for r in regions:
        grouped.setdefault(r["colorHex"], []).append(r)
    if len(grouped) <= PET_MAX_NEEDLES:
        return regions

    def importance(region: dict) -> int:
        base = 3 if region.get("regionType") == "feature" else 2 if region.get("regionType") == "outline" else 1
        pts = region.get("points", [])
        if not pts:
            return base
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        area = abs((max(xs) - min(xs)) * (max(ys) - min(ys)))
        return base * 100000 + int(area)

    color_rank = sorted(grouped.items(), key=lambda item: max(importance(r) for r in item[1]), reverse=True)
    keep = {c for c, _ in color_rank[:PET_MAX_NEEDLES]}
    fallback = color_rank[0][0]

    merged: List[dict] = []
    for r in regions:
        if r["colorHex"] not in keep:
            nr = dict(r)
            nr["colorHex"] = fallback
            merged.append(nr)
        else:
            merged.append(r)
    return merged


def build_pattern(regions: List[dict], config: DigitizeConfig) -> EmbPattern:
    pattern = EmbPattern()
    current_color = None
    for region in enforce_needle_capacity(regions):
        color = region["colorHex"]
        if current_color != color:
            if current_color is not None:
                pattern.add_command(COLOR_CHANGE)
            current_color = color
            pattern.threadlist.append(to_hex_thread(color))

        poly = [(float(p[0]), float(p[1])) for p in region["points"]]
        if not poly:
            continue

        tie_in(pattern, poly[0][0], poly[0][1])
        add_underlay(pattern, poly, region["regionType"])

        if classify_region(region["regionType"]) == "fill":
            fill_region(pattern, poly, float(region["angleDeg"]), config.fill_density_mm, config.max_stitch_mm)
        else:
            satin_region(pattern, poly, config.pull_comp_mm, config.max_stitch_mm)

        tie_off(pattern)
        pattern.add_stitch_relative(JUMP, 2, 2)

    pattern.add_command(END)
    return pattern


def qa_metrics(pattern: EmbPattern) -> dict:
    stitches = len(pattern.stitches)
    jumps = sum(1 for _, _, cmd in pattern.stitches if cmd == JUMP)
    trims = sum(1 for _, _, cmd in pattern.stitches if cmd == TRIM)
    colors = len(pattern.threadlist)
    return {
        "stitch_count": stitches,
        "jump_count": jumps,
        "trim_count": trims,
        "color_changes": colors,
        "valid": colors <= PET_MAX_NEEDLES,
        "pet_max_needles": PET_MAX_NEEDLES,
        "frame_reserved_needles": FRAME_RESERVED_NEEDLES,
        "total_needles": TOTAL_NEEDLES,
        "pyembroidery_available": PYEMBROIDERY_AVAILABLE,
    }


def render_stitch_preview_svg(pattern: EmbPattern, out_svg: str, width: int = 1024, height: int = 1024):
    points = [f"{int(x)},{int(y)}" for x, y, cmd in pattern.stitches if cmd == STITCH]
    polyline = " ".join(points[:12000])
    svg = (
        f"<svg xmlns='http://www.w3.org/2000/svg' width='{width}' height='{height}' viewBox='0 0 {width} {height}'>"
        f"<rect width='100%' height='100%' fill='#fef7ed'/>"
        f"<polyline fill='none' stroke='#2f2f2f' stroke-width='1' points='{polyline}'/>"
        f"</svg>"
    )
    Path(out_svg).write_text(svg)


def render_direction_map_json(regions: List[dict], out_json: str):
    payload = {
        "direction_vectors": [
            {
                "id": r.get("id"),
                "regionType": r.get("regionType"),
                "angleDeg": r.get("angleDeg"),
                "colorHex": r.get("colorHex"),
            }
            for r in regions
        ]
    }
    Path(out_json).write_text(json.dumps(payload, indent=2))


def render_direction_map_png_optional(regions: List[dict], size: Tuple[int, int], out_png: str):
    if not PIL_AVAILABLE:
        return False
    w, h = size
    img = Image.new("RGB", (w, h), "#f3f4f6")
    draw = ImageDraw.Draw(img)
    for region in regions:
        pts = [(float(x), float(y)) for x, y in region["points"]]
        if len(pts) < 4:
            continue
        x0 = min(p[0] for p in pts)
        x1 = max(p[0] for p in pts)
        y0 = min(p[1] for p in pts)
        y1 = max(p[1] for p in pts)
        theta = math.radians(float(region["angleDeg"]))
        vx = math.cos(theta)
        vy = math.sin(theta)
        for y in range(int(y0), int(y1), 16):
            for x in range(int(x0), int(x1), 16):
                draw.line((x, y, x + vx * 8, y + vy * 8), fill="#111827", width=1)
    img.save(out_png)
    return True


def generate_dst_from_manifest(
    manifest_path: str,
    out_dst: str,
    out_preview_svg: str,
    out_direction_json: str,
    canonical_hash: str,
    out_direction_png: str | None = None,
) -> dict:
    manifest = json.loads(Path(manifest_path).read_text())
    regions = manifest["regions"]
    width = int(manifest["width"])
    height = int(manifest["height"])

    config = DigitizeConfig()
    pattern = build_pattern(regions, config)
    write_dst(pattern, out_dst)
    render_stitch_preview_svg(pattern, out_preview_svg, width, height)
    render_direction_map_json(regions, out_direction_json)

    direction_png_written = False
    if out_direction_png:
        direction_png_written = render_direction_map_png_optional(regions, (width, height), out_direction_png)

    metrics = qa_metrics(pattern)
    metrics["canonical_hash"] = canonical_hash
    metrics["config_hash"] = sha256(json.dumps(asdict(config), sort_keys=True).encode()).hexdigest()
    metrics["debug_direction_json"] = out_direction_json
    metrics["debug_direction_png"] = out_direction_png if direction_png_written else None
    metrics["preview_svg"] = out_preview_svg
    metrics["pillow_available"] = PIL_AVAILABLE
    return metrics


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--dst", required=True)
    parser.add_argument("--preview-svg", required=True)
    parser.add_argument("--direction-json", required=True)
    parser.add_argument("--direction-png", required=False)
    parser.add_argument("--canonical-hash", required=True)
    args = parser.parse_args()

    metrics = generate_dst_from_manifest(
        args.manifest,
        args.dst,
        args.preview_svg,
        args.direction_json,
        args.canonical_hash,
        args.direction_png,
    )
    print(json.dumps(metrics))


if __name__ == "__main__":
    main()
