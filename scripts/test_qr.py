"""Decode final logo-bearing PNG and rendered SVG with two independent engines."""
from pathlib import Path
from io import BytesIO
import hashlib
import json
import cv2
import numpy as np
import zxingcpp
import resvg_py
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://japgarmando.github.io/Benevia/'
results = []


def verify(label, image):
    pixels = np.array(image.convert('RGB'))
    zx = zxingcpp.read_barcode(pixels)
    opencv = cv2.QRCodeDetector().detectAndDecode(pixels)[0]
    result = {'case': label, 'zxing': bool(zx and zx.text == URL), 'opencv': opencv == URL}
    results.append(result)
    print(json.dumps(result), flush=True)


original = Image.open(ROOT / 'qr/benevia-qr.png').convert('RGB')
# Check the full four-module border stays completely white.
pixels = np.array(original)
quiet = original.width * 4 // 45
assert all(np.all(part == 255) for part in (pixels[:quiet], pixels[-quiet:], pixels[:, :quiet], pixels[:, -quiet:]))
verify('PNG original 2700 px', original)
for size in [180, 240, 300, 450, 600, 1200]:
    resized = original.resize((size, size), Image.Resampling.LANCZOS)
    verify(f'PNG {size} px', resized)
    for quality in [95, 75, 50]:
        compressed = BytesIO()
        resized.save(compressed, format='JPEG', quality=quality)
        compressed.seek(0)
        verify(f'JPEG {size} px quality {quality}', Image.open(compressed))
for size in [180, 300, 600, 1200]:
    rendered = resvg_py.svg_to_bytes(svg_path=str(ROOT / 'qr/benevia-qr.svg'), width=size, height=size, dpi=96)
    verify(f'SVG rendered {size} px', Image.open(BytesIO(rendered)))
small = original.resize((600,600), Image.Resampling.LANCZOS)
verify('600 px blur radius 0.6', small.filter(ImageFilter.GaussianBlur(0.6)))
verify('600 px rotated 15 degrees', small.rotate(15, resample=Image.Resampling.BICUBIC, expand=True, fillcolor='white'))
verify('600 px rotated 90 degrees', small.rotate(90, expand=True))
src = np.float32([[0,0],[599,0],[599,599],[0,599]])
dst = np.float32([[20,10],[579,0],[599,579],[0,599]])
perspective = cv2.warpPerspective(np.array(small), cv2.getPerspectiveTransform(src,dst), (600,600), borderValue=(255,255,255))
verify('600 px perspective distortion', Image.fromarray(perspective))
report = {
    'expected_url': URL,
    'files': {name: hashlib.sha256((ROOT / 'qr' / name).read_bytes()).hexdigest() for name in ['benevia-qr.png','benevia-qr.svg']},
    'engines': {'opencv': cv2.__version__, 'zxing_cpp': '3.1.1'},
    'cases': results, 'passed': all(r['zxing'] and r['opencv'] for r in results),
    'note': 'Digital decoding tests; physical print/camera testing was not performed.'
}
(ROOT / 'qr/scan-results.json').write_text(json.dumps(report, indent=2) + '\n')
assert report['passed'], 'QR decoding failed; inspect scan-results.json'
print(f'PASS: {len(results)} variants × 2 decoders = {len(results)*2} successful decodes.')
