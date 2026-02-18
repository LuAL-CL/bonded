import json
import tempfile
import unittest
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parent))

from digitize import generate_dst_from_manifest, PIL_AVAILABLE


@unittest.skipUnless(PIL_AVAILABLE, "Pillow not installed; visual tests are optional")
class DigitizeVisualTest(unittest.TestCase):
    def test_direction_png_is_generated_when_pillow_available(self):
        with tempfile.TemporaryDirectory() as td:
            td_path = Path(td)
            manifest = td_path / "manifest.json"
            manifest.write_text(json.dumps({
                "width": 256,
                "height": 256,
                "regions": [
                    {"id": "fur", "colorHex": "#704f3f", "regionType": "fill", "angleDeg": 30, "points": [[10, 10], [220, 10], [220, 220], [10, 220]]}
                ]
            }))

            out_dst = td_path / "out.dst"
            out_svg = td_path / "preview.svg"
            out_direction_json = td_path / "direction.json"
            out_direction_png = td_path / "direction.png"

            metrics = generate_dst_from_manifest(
                str(manifest),
                str(out_dst),
                str(out_svg),
                str(out_direction_json),
                "b" * 64,
                str(out_direction_png),
            )
            self.assertTrue(out_direction_png.exists())
            self.assertEqual(metrics["debug_direction_png"], str(out_direction_png))


if __name__ == "__main__":
    unittest.main()
