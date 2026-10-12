"""Build the separate animated website without changing the original pricing page."""
from pathlib import Path
from urllib.parse import quote
import hashlib
import html
import json
import re
import shutil


def number(value):
    return float(value.replace('$', '').replace(',', '')) if re.fullmatch(r'\$[\d,]+\.\d{2}', value) else None


def build_experience(root: Path, output: Path, poster: dict):
    source = root / 'experiencia'
    if not source.is_dir():
        return
    target = output / 'experiencia'
    shutil.copytree(source, target, dirs_exist_ok=True)
    page = (source / 'index.html').read_text()
    data = json.loads((root / 'assets/precios-texto.json').read_text())
    current = data['poster_sha256'] == poster['poster_sha256']
    items = []
    extras = ''
    if current:
        for row in data['prices']:
            match = re.search(r'(\d+)\s*LTS', row[0])
            if not match:
                raise ValueError(f'No se encontró el tamaño en {row[0]}')
            item = {'liters': int(match.group(1)), 'plant': number(row[1]), 'delivery': number(row[2])}
            if item['plant'] is None:
                raise ValueError('El precio en planta debe estar especificado.')
            items.append(item)
        products = []
        for i, item in enumerate(items):
            liters = item['liters']
            plant = f"${item['plant']:.2f}"
            alternative = f"A domicilio: ${item['delivery']:.2f}" if item['delivery'] is not None else 'Domicilio: consulta el precio'
            message = quote(f'Hola, Benevia. Me interesa un garrafón de {liters} L. ¿Me confirman precio y disponibilidad?')
            link = f'https://wa.me/525561362046?text={message}'
            icon = '<span class="action-circle"><svg class="icon"><use href="#i-arrow"/></svg></span>'
            if i == 0:
                products.append(f'''<article class="product-card product-featured" aria-labelledby="product-{liters}">
<p class="product-kicker">Para compartir todos los días</p><h3 id="product-{liters}">{liters}<small>L</small></h3>
<p class="product-description">Agua para tu garrafón</p>
<div class="product-halo" aria-hidden="true"></div><img class="product-photo" src="assets/garrafon-original.webp" width="180" height="326" alt="Garrafón original de Benevia" loading="lazy">
<p class="product-price" data-price="{liters}">{plant} <small>MXN</small></p><p class="price-alternative" data-alternative="{liters}">{alternative}</p>
<a class="product-action" data-product="{liters}" href="{link}">Elegir {liters} litros {icon}</a><span class="product-ripple" aria-hidden="true"></span></article>''')
            else:
                products.append(f'''<article class="product-card product-compact" aria-labelledby="product-{liters}"><h3 id="product-{liters}">{liters}<small>L</small></h3><div class="compact-copy"><p class="product-description">Agua para tu garrafón</p><p class="product-price" data-price="{liters}">{plant} <small>MXN</small></p><p class="price-alternative" data-alternative="{liters}">{alternative}</p></div><a class="product-action" data-product="{liters}" href="{link}" aria-label="Elegir garrafón de {liters} litros">{icon}</a></article>''')
        content = '<div class="product-grid">' + products[0] + '<div class="compact-products">' + ''.join(products[1:]) + '</div></div>'
        extra_items = ''
        for item in data['extras']:
            title, price = item.rsplit(': ', 1)
            extra_items += f'<li><span>{html.escape(title)}</span><strong>{html.escape(price)}</strong></li>'
        extras = f'<div class="extras"><div><h3>Completa tu equipo.</h3><p>También los encuentras en Benevia.</p></div><ul class="extras-list">{extra_items}</ul></div>'
    else:
        content = '<div class="pricing-fallback"><p>Tenemos una nueva lista de precios.</p><a href="#cartel">Consulta el cartel actualizado <span aria-hidden="true">↓</span></a></div>'
    page = page.replace('<!-- EXPERIENCE_PRODUCTS -->', content)
    page = page.replace('<!-- EXPERIENCE_EXTRAS -->', extras)
    payload = json.dumps({'items': items}, ensure_ascii=False).replace('<', '\\u003c')
    page = page.replace('<!-- EXPERIENCE_PRICE_DATA -->', f'<script type="application/json" id="price-data">{payload}</script>')
    page = page.replace('../assets/precios.png', '../' + poster['png'])
    page = page.replace('width="960" height="1280"', f'width="{poster["width"]}" height="{poster["height"]}"')
    page = page.replace('<!-- EXPERIENCE_WEBP -->', f'<source srcset="../{poster["webp"]}" type="image/webp">')
    for name in ['styles.css', 'app.js']:
        body = (source / name).read_bytes()
        version = hashlib.sha256(body).hexdigest()[:12]
        file = Path(name)
        filename = f'{file.stem}.{version}{file.suffix}'
        (target / filename).write_bytes(body)
        page = page.replace(f'"{name}"', f'"{filename}"')
    (target / 'index.html').write_text(page)
    print(f'Experiencia: /experiencia/; precios sincronizados: {current}')
