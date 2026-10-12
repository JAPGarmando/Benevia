"""Prepare public files and fingerprint images on every deployment."""
from pathlib import Path
import hashlib
import html
import json
import shutil
from PIL import Image
if __package__:
    from .build_experience import build_experience
else:
    from build_experience import build_experience

ROOT = Path(__file__).resolve().parents[1]


def build(root=ROOT, output=None):
    output = output or root / "dist"
    output.mkdir(parents=True, exist_ok=True)
    for folder in ("assets", "qr"):
        shutil.copytree(root / folder, output / folder, dirs_exist_ok=True)
    poster = root / "assets/precios.png"
    digest = hashlib.sha256(poster.read_bytes()).hexdigest()
    version = digest[:16]
    png = f"assets/precios.{version}.png"
    webp = f"assets/precios.{version}.webp"
    shutil.copyfile(poster, output / png)
    with Image.open(poster) as image:
        if image.format != "PNG":
            raise ValueError("assets/precios.png debe ser un archivo PNG válido.")
        width, height = image.size
        image.convert("RGB").save(output / webp, "WEBP", quality=92, method=6)
    page = (root / "index.html").read_text()
    page = page.replace("assets/precios.png", png)
    page = page.replace('width="960" height="1280"', f'width="{width}" height="{height}"')
    page = page.replace("<!-- WEBP_SOURCE -->", f'<source srcset="{webp}" type="image/webp">')
    transcript = ""
    data = json.loads((root / "assets/precios-texto.json").read_text())
    # Never publish old text prices after an image-only update.
    if data["poster_sha256"] == digest:
        rows = "".join(
            "<tr>" + f'<th scope="row">{html.escape(row[0])}</th>'
            + "".join(f"<td>{html.escape(value)}</td>" for value in row[1:]) + "</tr>"
            for row in data["prices"]
        )
        extras = "".join(f"<li>{html.escape(item)}</li>" for item in data["extras"])
        transcript = f'''<details><summary>Consultar precios en texto</summary>
        <div class="transcript"><table><caption>Precios en pesos mexicanos (MXN).</caption>
        <thead><tr><th scope="col">Producto</th><th scope="col">Planta</th><th scope="col">Domicilio</th></tr></thead>
        <tbody>{rows}</tbody></table><ul class="extras">{extras}</ul></div></details>'''
    else:
        print("Aviso: cartel actualizado; se omite la transcripción anterior para no mostrar precios obsoletos.")
    page = page.replace("<!-- PRICE_TRANSCRIPT -->", transcript)
    (output / "index.html").write_text(page)
    (output / ".nojekyll").touch()
    (output / "assets/precios-texto.json").unlink(missing_ok=True)
    build_experience(root, output, {"poster_sha256": digest, "png": png, "webp": webp, "width": width, "height": height})
    print(f"Cartel: {width} × {height}; versión {version}; WebP {(output / webp).stat().st_size:,} bytes")
    return {"poster_sha256": digest, "png": png, "webp": webp}


if __name__ == "__main__":
    build()
