"""Generate a static QR. Price updates never require running this script."""
from pathlib import Path
import base64
import json
import qrcode
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
URL = "https://japgarmando.github.io/Benevia/"
VERSION, BORDER, SCALE = 5, 4, 60
FRAME_COLOR = "#e51c2b"
FRAME_PADDING = 2.5  # Extra canvas outside the QR's complete white quiet zone.


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
    canvas_modules = total + 2 * FRAME_PADDING
    canvas_pixels = round(canvas_modules * SCALE)
    qr_origin = round(FRAME_PADDING * SCALE)
    framed = Image.new("RGB", (canvas_pixels, canvas_pixels), "white")
    draw = ImageDraw.Draw(framed)
    draw.rounded_rectangle((24, 24, canvas_pixels-25, canvas_pixels-25), radius=120, fill=FRAME_COLOR)
    draw.rounded_rectangle((72, 72, canvas_pixels-73, canvas_pixels-73), radius=72, fill="white")
    framed.paste(image, (qr_origin, qr_origin))
    framed.save(ROOT / "qr/benevia-qr.png", optimize=True, dpi=(600,600))
    path = " ".join(f"M{c},{r}h1v1h-1z" for r,row in enumerate(matrix) for c,dark in enumerate(row) if dark)
    encoded = base64.b64encode((ROOT / "assets/logo-benevia.png").read_bytes()).decode()
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="70mm" height="70mm" viewBox="0 0 {canvas_modules} {canvas_modules}" role="img" aria-labelledby="title desc">
<title id="title">Benevia — código QR de la lista de precios</title>
<desc id="desc">{URL} — logo original completo, corrección H, margen de cuatro módulos y marco rojo exterior.</desc>
<rect width="{canvas_modules}" height="{canvas_modules}" fill="white"/>
<rect x="0.4" y="0.4" width="{canvas_modules-0.8}" height="{canvas_modules-0.8}" rx="2" fill="{FRAME_COLOR}"/>
<rect x="1.2" y="1.2" width="{canvas_modules-2.4}" height="{canvas_modules-2.4}" rx="1.2" fill="white"/>
<g transform="translate({FRAME_PADDING} {FRAME_PADDING})">
<rect width="{total}" height="{total}" fill="white"/>
<path d="{path}" fill="black" shape-rendering="geometricPrecision"/>
<rect x="{x}" y="{y}" width="{plate_w}" height="{plate_h}" fill="white"/>
<image x="{lx}" y="{ly}" width="{logo_w}" height="{logo_h}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,{encoded}"/>
</g>
</svg>'''
    (ROOT / "qr/benevia-qr.svg").write_text(svg)
    (ROOT / "qr/specification.json").write_text(json.dumps({
        "url": URL, "version": VERSION, "error_correction": "H", "quiet_zone_modules": BORDER,
        "data_modules": qr.modules_count, "total_modules": total, "png_pixels": framed.width,
        "qr_origin_px": [qr_origin, qr_origin], "qr_size_px": image.width,
        "frame": {"color": FRAME_COLOR, "width_px": 48, "outside_quiet_zone": True},
        "recommended_print_mm": 70, "minimum_print_mm": 50,
        "logo_source": "Photo 2.jpg, original red logo; no tracing or redesign",
        "svg": "Vector QR modules with the original lossless PNG logo embedded"
    }, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    generate()
