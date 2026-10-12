# Benevia · Que fluya lo bueno

Página independiente: https://japgarmando.github.io/Benevia/experiencia/

La página original permanece en `/Benevia/`, sin cambios de diseño, de cartel ni de QR. El despliegue publica ambas páginas desde el mismo repositorio.

## Diseño y funcionamiento

Identidad original de Benevia, con rojo, azul hielo y azul marino. Tipografía Bricolage Grotesque para titulares y Manrope para lectura, alojadas localmente con sus licencias OFL. No se solicitan fuentes externas.

- Escultura de agua con refracción mediante un pequeño shader WebGL, respuesta al puntero e imagen estática de respaldo.
- Titulares de entrada, cinta continua, profundidad en el garrafón, ruta de reparto animada, ondas y transiciones de precios.
- Botón para pausar las animaciones y respeto a `prefers-reduced-motion`. El canvas deja de dibujar fuera de pantalla o en pestañas ocultas; limita la resolución y la frecuencia de dibujo.
- Precios de planta y domicilio vinculados al cartel oficial. El precio no especificado de 5 L a domicilio se muestra como «Consultar» y nunca se calcula como cero.
- Pedido con cantidades y subtotal; WhatsApp recibe un borrador. El visitante decide enviarlo. No hay servidor de pedidos, pagos ni almacenamiento de direcciones.
- Cartel completo ampliable, navegación móvil, enlaces de teléfono y ubicación. El mapa externo se solicita solo cuando se pulsa «Ver mapa interactivo».
- HTML útil sin JavaScript. El logo y el cartel siguen siendo los originales. Sin WebGL se conserva la fotografía decorativa.

## Datos del negocio y fuentes

La fuente principal es el cartel proporcionado por el propietario y su corrección posterior del cierre a las **5:00 pm**. No se incorporaron reseñas, certificaciones, años de operación, radio de entrega ni tiempos de reparto que no hayan sido confirmados.

Se contrastó la presencia pública de Benevia y su teléfono en [AllBiz](https://www.allbiz.mx/purificadora-de-agua-benevia-55-5605-4377) y en el [directorio de purificadoras](https://purificadoradeaguaenmexico.com.mx/ciudad-de-mexico/benito-juarez-ciudad-de-mexico/purificadora-de-agua-benevia/). Estos directorios contienen horarios anteriores e inconsistencias en la dirección; prevalecen los datos proporcionados por el propietario. El enlace del mapa busca expresamente Benevia en Pirineos 121, Portales Sur, CDMX. La cobertura se confirma por WhatsApp.

## Procedencia del material gráfico

- `../assets/logo-benevia.png`: logo completo original proporcionado por el propietario. Sin reconstrucción tipográfica ni rediseño.
- `../assets/precios.png`: cartel oficial y horario corregido por el propietario.
- `assets/garrafon-original.webp`: recorte del garrafón real del cartel, con máscara de transparencia; conserva sus píxeles y la marca.
- `assets/agua-720.webp` y `agua-1200.webp`: una misma obra decorativa creada con el generador de imágenes integrado. Dirección del prompt: escultura de una gota de agua cristalina flotando sobre un estanque con ondas, refracciones cobalto, luz azul hielo, composición vertical, sin texto, logos ni envases.
- `assets/vaso-de-agua.webp`: obra decorativa creada con el generador integrado. Dirección del prompt: vaso transparente que recibe agua de una jarra, mesa azul clara, luz natural con caústicas, pequeño detalle de tela roja, sin personas, logos ni texto. No representa una fotografía de las instalaciones ni una certificación del producto.
- Iconos y ondas: SVG y CSS originales, sin librerías de iconos.
- Fuentes: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) y [Manrope](https://fonts.google.com/specimen/Manrope); licencias en `assets/fonts/`.

## Mantenimiento

Edita `index.html`, `styles.css` o `app.js` en esta carpeta. No edites `dist/`, que se reconstruye automáticamente. El script `scripts/build_experience.py` copia la página, inserta los precios vigentes y asigna nombres con huella a CSS, JavaScript y cartel. Después de push a `main`, GitHub Actions publica ambas páginas.

Para cambiar precios, reemplaza `assets/precios.png` en la raíz del repositorio. Para conservar la calculadora, sincroniza además `assets/precios-texto.json` con la nueva huella. Un cartel actualizado sin transcripción nueva desactiva automáticamente los precios de texto antiguos. El QR impreso conserva su URL permanente.

Si cambia un dato de contacto, actualiza los enlaces y el JSON-LD de esta página, `app.js`, la página original y el cartel según corresponda. Si reemplazas arte o fuentes, usa un nombre de archivo nuevo y actualiza sus referencias para evitar cachés anteriores.

Consulta el README principal para preparar el sitio y ejecutar las pruebas de navegador. Las dependencias de desarrollo no se publican ni se usan para alojar la página. La web requiere únicamente GitHub Pages, sin suscripciones, claves API ni servicios de pago.
