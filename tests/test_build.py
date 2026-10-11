"""Verify the business-critical promise: change the poster, keep the QR."""
from pathlib import Path
import hashlib
import shutil
import tempfile
import unittest
from PIL import Image
from scripts.build import build, ROOT


class PriceUpdates(unittest.TestCase):
    def test_image_only_update_changes_asset_urls_without_changing_qr(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shutil.copy(ROOT / 'index.html', root)
            for folder in ('assets', 'qr'):
                shutil.copytree(ROOT / folder, root / folder)
            qr_before = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (root / 'qr').iterdir()}
            before = build(root, root / 'first')
            self.assertIn('Consultar precios en texto', (root / 'first/index.html').read_text())
            with Image.open(root / 'assets/precios.png') as original:
                changed = original.resize((720, 960))
            changed.putpixel((0, 0), (0, 0, 0))
            changed.save(root / 'assets/precios.png')
            after = build(root, root / 'second')
            page = (root / 'second/index.html').read_text()
            self.assertNotEqual(before['png'], after['png'])
            self.assertNotEqual(before['webp'], after['webp'])
            self.assertIn('width="720" height="960"', page)
            self.assertIn('https://japgarmando.github.io/Benevia/', page)
            self.assertIn('https://wa.me/525561362046', page)
            self.assertNotIn('Consultar precios en texto', page)
            self.assertNotIn('$35.00', page)
            for asset in ('png', 'webp'):
                self.assertTrue((root / 'second' / after[asset]).is_file())
            qr_after = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (root / 'second/qr').iterdir()}
            self.assertEqual(qr_before, qr_after)


if __name__ == '__main__':
    unittest.main()
