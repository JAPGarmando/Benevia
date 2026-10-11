"""Generate a static QR. Price updates never require running this script."""
from pathlib import Path
import base64
import json
import qrcode
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
URL = "https://japgarmando.github.io/Benevia/"
VERSION, BORDER, SCALE = 5, 4, 60


def generate():
    qr = qrcode.QRCode(version=VERSION, error_correction=qrcode.constants.ERROR_CORRECT_H,
                       box_size=SCALE, border=BORDER)
    qr.add_data(URL)
    qr.make(fit=False)
    matrix = qr.get_matrix()
    total = len(matrix)
    image = qr.make_image(fill_color="#000000", back_color="#ffffff").convert("RGB")
    plate_w, plate_h = 21, 9
    x, y = (total - plate_w) / 2, (total - plate_h) / 2
    logo = Image.open(ROOT / "assets/logo-benevia.png").convert("RGB")
    logo_w = 19
    logo_h = logo_w * logo.height / logo.width
    lx, ly = (total - logo_w) / 2, (total - logo_h) / 2
    image.paste("white", (round(x*SCALE), round(y*SCALE), round((x+plate_w)*SCALE), round((y+plate_h)*SCALE)))
    mark = logo.resize((round(logo_w*SCALE), round(logo_h*SCALE)), Image.Resampling.LANCZOS)
    image.paste(mark, (round(lx*SCALE), round(ly*SCALE)))
    image.save(ROOT / "qr/benevia-qr.png", optimize=True, dpi=(600,600))
    path = " ".join(f"M{c},{r}h1v1h-1z" for r,row in enumerate(matrix) for c,dark in enumerate(row) if dark)
    encoded = base64.b64encode((ROOT / "assets/logo-benevia.png").read_bytes()).decode()
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="70mm" height="70mm" viewBox="0 0 {total} {total}" role="img" aria-labelledby="title desc">
<title id="title">Benevia — código QR de la lista de precios</title>
<desc id="desc">{URL} — logo original completo, corrección H y margen de cuatro módulos.</desc>
<rect width="{total}" height="{total}" fill="white"/>
<path d="{path}" fill="black" shape-rendering="crispEdges"/>
<rect x="{x}" y="{y}" width="{plate_w}" height="{plate_h}" fill="white"/>
<image x="{lx}" y="{ly}" width="{logo_w}" height="{logo_h}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,{encoded}"/>
</svg>'''
    (ROOT / "qr/benevia-qr.svg").write_text(svg)
    (ROOT / "qr/specification.json").write_text(json.dumps({
        "url": URL, "version": VERSION, "error_correction": "H", "quiet_zone_modules": BORDER,
        "data_modules": qr.modules_count, "total_modules": total, "png_pixels": image.width,
        "recommended_print_mm": 70, "minimum_print_mm": 50,
        "logo_source": "Photo 2.jpg, original red logo; no tracing or redesign",
        "svg": "Vector QR modules with the original lossless PNG logo embedded"
    }, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    generate()
