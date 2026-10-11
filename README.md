# Benevia · Agua Purificada baja en sales

Sitio oficial de precios: **https://japgarmando.github.io/Benevia/**

Repositorio: https://github.com/JAPGarmando/Benevia

El QR contiene directamente esa URL, incluida la `/` final. No utiliza redirecciones comerciales, cuentas de QR, suscripciones ni servicios de pago. Sigue funcionando mientras el repositorio, esa ruta y GitHub Pages permanezcan activos.

## Actualizar precios sin cambiar el QR

1. Reemplaza **`assets/precios.png`** por el nuevo cartel, en formato PNG. Conserva ese nombre.
2. Haz commit y push a **`main`** (también puedes reemplazar el archivo desde GitHub).
3. Espera a que termine en verde **Actions → Deploy Benevia to GitHub Pages**.
4. Abre https://japgarmando.github.io/Benevia/ para comprobar el cartel.

**No modifiques ni regeneres los archivos de `qr/`. No necesitas volver a imprimir el QR.** El flujo no ejecuta el generador de QR: copia los mismos archivos en cada despliegue.

El despliegue calcula una huella SHA-256 del cartel y genera nombres nuevos como `precios.f37eb31cc5aa57d8.png` y `.webp`. Actualiza automáticamente los enlaces y las dimensiones de la imagen. Esto evita reutilizar la imagen anterior desde la caché; no hay service worker ni caché propia. GitHub Pages controla la caché del HTML y puede tardar unos minutos en reflejar un despliegue. Una pestaña que ya estaba abierta debe recargarse.

### Versión de texto accesible

`assets/precios-texto.json` contiene una transcripción opcional de los precios. Está vinculada a la huella del cartel: si solo cambias el PNG, el sitio publica la imagen nueva y **omite la transcripción antigua**, evitando precios contradictorios. Los teléfonos y botones siguen disponibles como texto.

Para mantener también la tabla accesible, actualiza sus precios y `poster_sha256` en el mismo commit. Obtén la huella del PNG con:

```sh
python3 -c "import hashlib; print(hashlib.sha256(open('assets/precios.png','rb').read()).hexdigest())"
```

Si cambian los teléfonos, el domicilio o el horario, actualiza también el bloque de contacto en `index.html`.

## QR listo para imprimir

- [Descargar PNG de alta resolución](https://japgarmando.github.io/Benevia/qr/benevia-qr.png): **3000 × 3000 px**, metadatos de 600 ppp, con marco rojo de esquinas redondeadas.
- [Descargar SVG](https://japgarmando.github.io/Benevia/qr/benevia-qr.svg): módulos vectoriales y el logo original en PNG integrado; no requiere archivos externos. El logo conserva el detalle de la imagen fuente, no es una reconstrucción vectorial.
- [Logo original extraído](assets/logo-benevia.png).
- [Resultados reproducibles de lectura](qr/scan-results.json).

Imprime preferentemente a **7 × 7 cm**, con un mínimo de **5 × 5 cm**, incluyendo el margen blanco. No recortes el margen, deformes el cuadrado ni añadas texto dentro del código. Una prueba con un teléfono sobre la impresión final permite comprobar el papel, el tamaño y la iluminación reales.

Especificación: QR versión 5, corrección de errores **H**, módulos negros, fondo blanco, zona libre de **4 módulos**. El marco rojo se sitúa fuera de esa zona, en un lienzo ampliado: no modifica los módulos ni el logo original. El logo completo está centrado, con una placa blanca y sus proporciones originales. Las pruebas digitales usan **ZXing-C++ y OpenCV**, PNG, JPEG a distintas calidades, SVG renderizado, tamaños reducidos, desenfoque leve, rotación y perspectiva. Los resultados digitales no sustituyen una prueba física de impresión.

## Material gráfico y datos oficiales

- `Photo 1.jpg`, proporcionada por el propietario, ya contiene todos los precios actualizados. Se convirtió a PNG conservando el fondo, los garrafones, el logo y el texto. Posteriormente se corrigió únicamente el dígito de cierre, de «6:00 pm» a «5:00 pm», a solicitud del propietario. Se usó el editor de imágenes integrado con la instrucción «cambiar únicamente 6:00 pm por 5:00 pm, conservando el diseño»; solo se incorporó la región del dígito corregido. Todos los píxeles fuera de esa región permanecen idénticos al cartel original. El sitio ofrece una copia WebP optimizada y permite ampliar el PNG original.
- El logo procede de `Photo 2.jpg`: región `(254, 501, 1034, 741)` del original de 1280 × 1280. Se conservaron los píxeles rojos del logo y se limpió el fondo de los módulos del QR anterior. Incluye nombre completo, líneas decorativas, estrella, MR y lema. No se utilizó IA generativa, tipografía sustitutiva ni un rediseño.
- Se cotejaron ambos materiales con la información solicitada: no se encontraron discrepancias. El domicilio del cartel usa la abreviatura «Col. Portales Sur»; el contacto de la página añade Ciudad de México.

| Producto | Planta | Domicilio |
| --- | --- | --- |
| Garrafón 20 LTS | $35.00 | $40.00 |
| Garrafón 11 LTS | $20.00 | $25.00 |
| Garrafón 10 LTS | $15.00 | $20.00 |
| Garrafón 5 LTS | $5.00 | No especificado |

Llave Punzoflex: $50.00. Garrafón nuevo 20 LTS: $130.00. Garrafón nuevo 11 LTS: $110.00. Importes en MXN, correspondientes al cartel inicial; el cartel publicado es la referencia para actualizaciones futuras.

Horario: lunes a sábado, 8:30 am a 5:00 pm. Pedidos hasta las 5:00 pm. Servicio a domicilio. Teléfono: 55 5605 4377. WhatsApp: 55 6136 2046. Pirineos 121, Colonia Portales Sur, C.P. 03300, Ciudad de México.

## Estructura y despliegue

```text
index.html                    Página en español, sin framework ni JavaScript
assets/precios.png            Cartel oficial que se reemplaza al actualizar precios
assets/logo-benevia.png        Logo original completo
assets/precios-texto.json      Transcripción accesible opcional vinculada al cartel
qr/benevia-qr.png              QR para impresión
qr/benevia-qr.svg              QR con módulos vectoriales
qr/specification.json          Especificación del QR
qr/scan-results.json           Resultados de dos decodificadores
scripts/build.py              Prepara dist/ y versiones de imágenes
scripts/generate_qr.py         Generador; no se ejecuta al cambiar precios
scripts/test_qr.py             Pruebas reales de lectura
tests/test_build.py           Prueba del cambio de cartel y permanencia del QR
.github/workflows/deploy.yml   Despliegue automático a GitHub Pages
```

GitHub Pages debe tener como fuente **GitHub Actions**. El flujo usa `actions/checkout`, `actions/configure-pages`, `actions/upload-pages-artifact` y `actions/deploy-pages`, con versiones estables verificadas al implementar. Solo el trabajo de despliegue recibe `pages: write` e `id-token: write`; la preparación usa lectura. El sitio público es HTML/CSS e imágenes; Python/Pillow se usan únicamente al preparar archivos. El repositorio público permite alojar esta web en GitHub Pages sin contratar hosting.

Referencias oficiales: [flujos personalizados de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [checkout](https://github.com/actions/checkout/releases), [configure-pages](https://github.com/actions/configure-pages/releases), [upload-pages-artifact](https://github.com/actions/upload-pages-artifact/releases), [deploy-pages](https://github.com/actions/deploy-pages/releases).

## Desarrollo y comprobación

No se necesita entorno de desarrollo para reemplazar el cartel desde GitHub. Para trabajar localmente con Python 3.12 o posterior:

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements-build.txt
.venv/bin/python -m unittest discover -s tests -p 'test_build.py' -v
.venv/bin/python scripts/build.py
.venv/bin/python -m http.server 8000 --directory dist
```

Abre `http://localhost:8000`. La prueba simula cambiar solamente el PNG y comprueba que cambian sus URLs, se actualizan las dimensiones, no aparecen precios de texto antiguos y el QR conserva exactamente los mismos bytes.

Solo para regenerar o verificar el QR (no necesario al actualizar precios):

```sh
.venv/bin/pip install -r requirements-qr.txt
.venv/bin/python scripts/generate_qr.py
.venv/bin/python scripts/test_qr.py
```

El SVG se renderiza con resvg-py, sin instalar bibliotecas gráficas del sistema. La preparación y el despliegue normal no necesitan resvg, OpenCV ni ZXing.
