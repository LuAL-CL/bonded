import json
import tempfile
import unittest
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parent))

from digitize import generate_dst_from_manifest, PET_MAX_NEEDLES


class DigitizeCoreTest(unittest.TestCase):
    def test_generate_dst_and_metrics_without_visual_dependencies(self):
        with tempfile.TemporaryDirectory() as td:
            td_path = Path(td)
            manifest = td_path / "manifest.json"
            manifest.write_text(json.dumps({
                "width": 256,
                "height": 256,
                "regions": [
                    {"id": "eye-left", "colorHex": "#111111", "regionType": "feature", "angleDeg": 90, "points": [[50, 50], [70, 50], [70, 70], [50, 70]]},
                    {"id": "nose", "colorHex": "#1a1a1a", "regionType": "feature", "angleDeg": 90, "points": [[120, 120], [140, 120], [140, 140], [120, 140]]},
                    {"id": "fur-main", "colorHex": "#8a6a53", "regionType": "fill", "angleDeg": 25, "points": [[20, 20], [220, 20], [220, 220], [20, 220]]}
                ]
            }))

            out_dst = td_path / "out.dst"
            out_svg = td_path / "stitch-preview.svg"
            out_direction_json = td_path / "direction.json"
            metrics = generate_dst_from_manifest(str(manifest), str(out_dst), str(out_svg), str(out_direction_json), "a" * 64)

            self.assertTrue(out_dst.exists())
            self.assertTrue(out_svg.exists())
            self.assertTrue(out_direction_json.exists())
            self.assertTrue(metrics["valid"])
            self.assertLessEqual(metrics["color_changes"], PET_MAX_NEEDLES)
            self.assertIn("config_hash", metrics)


if __name__ == "__main__":
    unittest.main()
