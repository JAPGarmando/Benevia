(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('enhanced');
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  try { paused = localStorage.getItem('benevia-motion') === 'paused'; } catch {}
  let motion = !reduced.matches && !paused;
  const announce = (message) => { $('#live-announcement').textContent = message; };
  function syncMotion() {
    motion = !reduced.matches && !paused;
    root.dataset.motion = motion ? 'active' : 'paused';
    $$('.motion-toggle').forEach(button => {
      button.hidden = false;
      button.disabled = reduced.matches;
      button.setAttribute('aria-pressed', String(!motion));
      const label = reduced.matches ? 'Animaciones desactivadas por tu preferencia de movimiento reducido' : motion ? 'Pausar animaciones' : 'Activar animaciones';
      button.setAttribute('aria-label', label);
      button.title = label;
      if (button.classList.contains('footer-motion')) button.textContent = reduced.matches ? 'Movimiento reducido activado' : label;
    });
    window.dispatchEvent(new Event('benevia:motion'));
  }
  $$('.motion-toggle').forEach(button => button.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('benevia-motion', paused ? 'paused' : 'active'); } catch {}
    syncMotion();
  }));
  reduced.addEventListener('change', syncMotion);
  syncMotion();

  const menuButton = $('.menu-toggle');
  const menu = $('#mobile-menu');
  menuButton.hidden = false;
  function setMenu(open) {
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    $('use', menuButton).setAttribute('href', open ? '#i-close' : '#i-menu');
  }
  menuButton.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 701px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

  let scrollScheduled = false;
  function updateScroll() {
    scrollScheduled = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    root.style.setProperty('--scroll-progress', String(max > 0 ? Math.min(1, scrollY / max) : 0));
    if (motion) {
      const story = $('.everyday');
      const bounds = story.getBoundingClientRect();
      if (bounds.top < innerHeight && bounds.bottom > 0) story.style.setProperty('--story-progress', String((innerHeight - bounds.top) / (innerHeight + bounds.height)));
    }
  }
  window.addEventListener('scroll', () => { if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  updateScroll();
  const mobileBar = $('.mobile-order-bar');
  mobileBar.hidden = false;
  new IntersectionObserver(entries => {
    mobileBar.classList.toggle('visible', !entries[0].isIntersecting && scrollY > 300);
  }, { threshold: 0 }).observe($('.hero'));

  // Native dialog focus management; ordinary WhatsApp/image links remain the fallback.
  let dialogOpener = null;
  function openDialog(dialog, opener) {
    if (!dialog || !dialog.showModal) return false;
    dialogOpener = opener || document.activeElement;
    dialog.showModal();
    document.body.classList.add('dialog-open');
    return true;
  }
  $$('dialog').forEach(dialog => {
    $$('[data-close-dialog]', dialog).forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      if (dialogOpener?.isConnected) dialogOpener.focus({ preventScroll: true });
    });
  });
  $$('[data-poster-open]').forEach(link => link.addEventListener('click', event => {
    if (openDialog($('#poster-dialog'), link)) event.preventDefault();
  }));

  // Price data is emitted only when it matches the official poster's exact hash.
  let catalog = [];
  try { catalog = JSON.parse($('#price-data')?.textContent || '{"items":[]}').items; } catch {}
  if (catalog.length) {
    const state = { mode: 'plant', quantities: Object.fromEntries(catalog.map(item => [item.liters, 0])) };
    const money = amount => `$${Number(amount).toFixed(2)}`;
    const priceFor = item => item[state.mode];
    const orderDialog = $('#order-dialog');
    const total = $('#order-total');
    const sendLink = $('#order-send');
    $('#order-lines').innerHTML = catalog.map(item => `<div class="order-line"><div><label class="order-line-name" for="qty-${item.liters}">Garrafón ${item.liters} L</label><p class="order-line-price" data-line-price="${item.liters}"></p></div><div class="quantity-control"><button type="button" data-step="-1" data-liters="${item.liters}" aria-label="Quitar un garrafón de ${item.liters} litros"><svg class="icon"><use href="#i-minus"/></svg></button><input id="qty-${item.liters}" data-quantity="${item.liters}" type="number" min="0" max="20" step="1" value="0" inputmode="numeric" aria-label="Cantidad de garrafones de ${item.liters} litros"><button type="button" data-step="1" data-liters="${item.liters}" aria-label="Agregar un garrafón de ${item.liters} litros"><svg class="icon"><use href="#i-plus"/></svg></button></div></div>`).join('');
    function renderOrder() {
      let sum = 0;
      let count = 0;
      let unknown = false;
      const lines = [];
      catalog.forEach(item => {
        const quantity = state.quantities[item.liters];
        const price = priceFor(item);
        $(`[data-line-price="${item.liters}"]`).textContent = price == null ? 'Precio a domicilio por confirmar' : `${money(price)} MXN por garrafón`;
        const input = $(`[data-quantity="${item.liters}"]`);
        if (document.activeElement !== input || input.value !== '') input.value = String(quantity);
        const minus = $(`[data-step="-1"][data-liters="${item.liters}"]`);
        const plus = $(`[data-step="1"][data-liters="${item.liters}"]`);
        minus.disabled = quantity === 0;
        plus.disabled = quantity === 20;
        if (!quantity) return;
        count += quantity;
        if (price == null) unknown = true; else sum += quantity * price;
        lines.push(`${quantity} × garrafón de ${item.liters} L: ${price == null ? 'precio por confirmar' : money(quantity * price) + ' MXN'}`);
      });
      total.parentElement.classList.toggle('unknown', unknown);
      if (unknown) total.textContent = 'Por confirmar'; else total.innerHTML = `${money(sum)} <small>MXN</small>`;
      $('#total-label').textContent = unknown ? 'Total del pedido' : 'Total de agua';
      $('#order-note').textContent = unknown ? `El precio de 5 L a domicilio no está especificado. ${sum ? 'Subtotal de los otros tamaños: ' + money(sum) + ' MXN. ' : ''}Confírmalo por WhatsApp.` : 'El pedido y la disponibilidad se confirman por WhatsApp. Garrafones nuevos no incluidos.';
      $('#order-empty').hidden = count > 0;
      sendLink.setAttribute('aria-disabled', String(count === 0));
      sendLink.tabIndex = count === 0 ? -1 : 0;
      $('#clear-order').hidden = count === 0;
      $$('.cart-count').forEach(badge => { badge.hidden = count === 0; badge.textContent = String(count); });
      if (!count) { sendLink.removeAttribute('href'); return; }
      const message = [`Hola, Benevia. Quisiera hacer un pedido ${state.mode === 'delivery' ? 'a domicilio' : 'para recoger en planta'}:`, '', ...lines, '', unknown ? `Total por confirmar.${sum ? ' Subtotal de los tamaños con precio: ' + money(sum) + ' MXN.' : ''}` : `Total de agua: ${money(sum)} MXN.`, state.mode === 'delivery' ? '¿Me confirman disponibilidad y cobertura para mi dirección?' : '¿Me confirman disponibilidad, por favor?'].join('\n');
      sendLink.href = `https://wa.me/525561362046?text=${encodeURIComponent(message)}`;
    }
    function renderPrices() {
      $$('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)));
      catalog.forEach(item => {
        const price = priceFor(item);
        const element = $(`[data-price="${item.liters}"]`);
        element.innerHTML = price == null ? 'Consultar' : `${money(price)} <small>MXN</small>`;
        if (motion) { element.classList.remove('price-changing'); void element.offsetWidth; element.classList.add('price-changing'); }
        const alternative = $(`[data-alternative="${item.liters}"]`);
        const alternatePrice = state.mode === 'plant' ? item.delivery : item.plant;
        alternative.textContent = state.mode === 'plant' ? alternatePrice == null ? 'Domicilio: consulta el precio' : `A domicilio: ${money(alternatePrice)}` : `En planta: ${money(alternatePrice)}`;
      });
      $('#price-note').textContent = state.mode === 'delivery' ? 'Precios en MXN. Confirma cobertura y disponibilidad por WhatsApp. Garrafones nuevos por separado.' : 'Precios en pesos mexicanos. Los garrafones nuevos se venden por separado.';
      renderOrder();
    }
    $$('[data-mode]').forEach(button => button.addEventListener('click', () => {
      if (state.mode === button.dataset.mode) return;
      state.mode = button.dataset.mode;
      renderPrices();
      announce(`Mostrando precios ${state.mode === 'delivery' ? 'a domicilio' : 'en planta'}.`);
    }));
    $$('[data-product]').forEach(link => link.addEventListener('click', event => {
      const liters = Number(link.dataset.product);
      if (!Object.hasOwn(state.quantities, liters)) return;
      if (!openDialog(orderDialog, link)) return;
      event.preventDefault();
      state.quantities[liters] = Math.min(20, state.quantities[liters] + 1);
      renderOrder();
    }));
    $$('[data-order-open]').forEach(link => link.addEventListener('click', event => {
      if (!openDialog(orderDialog, link)) return;
      event.preventDefault();
      if (link.dataset.orderMode) state.mode = link.dataset.orderMode;
      if (!Object.values(state.quantities).some(Boolean)) state.quantities[20] = 1;
      renderPrices();
    }));
    $$('[data-step]').forEach(button => button.addEventListener('click', () => {
      const liters = Number(button.dataset.liters);
      state.quantities[liters] = Math.max(0, Math.min(20, state.quantities[liters] + Number(button.dataset.step)));
      renderOrder();
      announce(`Garrafón de ${liters} litros: ${state.quantities[liters]}.`);
    }));
    $$('[data-quantity]').forEach(input => {
      const update = () => {
        const value = Number(input.value);
        state.quantities[Number(input.dataset.quantity)] = Number.isFinite(value) ? Math.max(0, Math.min(20, Math.trunc(value))) : 0;
        renderOrder();
      };
      input.addEventListener('input', update);
      input.addEventListener('change', () => { update(); input.value = String(state.quantities[Number(input.dataset.quantity)]); });
    });
    $('#clear-order').addEventListener('click', () => { Object.keys(state.quantities).forEach(key => { state.quantities[key] = 0; }); renderOrder(); announce('Pedido vacío.'); });
    sendLink.addEventListener('click', event => { if (sendLink.getAttribute('aria-disabled') === 'true') event.preventDefault(); });
    renderPrices();
  } else {
    $$('.mode-control').forEach(control => { control.hidden = true; });
  }

  // Load Google's real map only after an explicit interaction.
  const mapButton = $('#load-map');
  mapButton.hidden = false;
  mapButton.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.title = 'Ubicación de Benevia en Pirineos 121, Portales Sur, Ciudad de México';
    frame.src = 'https://maps.google.com/maps?q=Purificadora%20Benevia%20Pirineos%20121%20Portales%20Sur%20Ciudad%20de%20M%C3%A9xico&z=16&output=embed';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    const panel = $('.map-panel');
    panel.append(frame);
    panel.classList.add('map-loaded');
  }, { once: true });

  // Subtle depth follows a mouse; no tilt on touch or reduced-motion devices.
  const feature = $('.product-featured');
  if (feature && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    feature.addEventListener('pointermove', event => {
      if (!motion) return;
      const bounds = feature.getBoundingClientRect();
      feature.style.setProperty('--tilt-x', `${((event.clientX - bounds.left) / bounds.width - .5) * 4}deg`);
      feature.style.setProperty('--tilt-y', `${((event.clientY - bounds.top) / bounds.height - .5) * -4}deg`);
    });
    feature.addEventListener('pointerleave', () => { feature.style.setProperty('--tilt-x', '0deg'); feature.style.setProperty('--tilt-y', '0deg'); });
  }

  // A small native WebGL shader refracts the artwork. The image underneath is a complete fallback.
  const canvas = $('#water-canvas');
  const artwork = $('#water-image');
  let waterStarted = false;
  function initWater() {
    if (waterStarted || !artwork.complete || !artwork.naturalWidth) return;
    waterStarted = true;
    let gl;
    try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' }); } catch { return; }
    if (!gl) return;
    try {
      const vertex = 'attribute vec2 a_position; varying vec2 v_uv; void main(){v_uv=(a_position+1.0)*0.5;gl_Position=vec4(a_position,0.0,1.0);}';
      const fragment = `precision mediump float; varying vec2 v_uv; uniform sampler2D u_image; uniform vec2 u_mouse; uniform vec2 u_scale; uniform float u_time;
        void main(){vec2 uv=(v_uv-0.5)*u_scale+0.5;float d=length(v_uv-u_mouse);float ring=sin(d*34.0-u_time*1.7)*exp(-d*5.0);vec2 wave=vec2(sin(uv.y*11.0+u_time*.65),cos(uv.x*10.0-u_time*.45))*.0022;vec2 ripple=normalize(v_uv-u_mouse+vec2(.0001))*ring*.003;uv+=wave+ripple+(u_mouse-.5)*.004;gl_FragColor=texture2D(u_image,clamp(uv,0.001,0.999));}`;
      function compile(type, source) {
        const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader unavailable');
        return shader;
      }
      const program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, artwork);
      const uTime = gl.getUniformLocation(program, 'u_time');
      const uMouse = gl.getUniformLocation(program, 'u_mouse');
      const uScale = gl.getUniformLocation(program, 'u_scale');
      let mouse = [.5,.5], target = [.5,.5], frame = 0, visible = true, last = 0, elapsed = 0, lost = false;
      function resize() {
        const bounds = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(Math.min(1.5, devicePixelRatio) * bounds.width));
        canvas.height = Math.max(1, Math.round(Math.min(1.5, devicePixelRatio) * bounds.height));
        gl.viewport(0, 0, canvas.width, canvas.height);
        const ratio = bounds.width / bounds.height, imageRatio = artwork.naturalWidth / artwork.naturalHeight;
        gl.uniform2f(uScale, Math.min(1, ratio / imageRatio), Math.min(1, imageRatio / ratio));
      }
      new ResizeObserver(resize).observe(canvas);
      $('.hero-art').addEventListener('pointermove', event => {
        const bounds = canvas.getBoundingClientRect();
        target = [(event.clientX-bounds.left)/bounds.width, 1-(event.clientY-bounds.top)/bounds.height];
      }, { passive: true });
      function draw(now) {
        frame = 0;
        if (!motion || !visible || document.hidden || lost) return;
        if (now-last >= 32) {
          elapsed += Math.min(50, now-last) / 1000; last = now;
          mouse = mouse.map((value, i) => value + (target[i]-value)*.035);
          gl.uniform1f(uTime, elapsed); gl.uniform2f(uMouse, ...mouse);
          gl.drawArrays(gl.TRIANGLES, 0, 6); canvas.classList.add('ready');
        }
        frame = requestAnimationFrame(draw);
      }
      function sync() {
        if (motion && visible && !document.hidden && !lost) { if (!frame) { last = performance.now(); frame = requestAnimationFrame(draw); } }
        else { cancelAnimationFrame(frame); frame = 0; }
      }
      canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; canvas.classList.remove('ready'); sync(); });
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { rootMargin: '50px' }).observe(canvas);
      document.addEventListener('visibilitychange', sync);
      window.addEventListener('benevia:motion', sync);
      resize(); sync();
    } catch { canvas.classList.remove('ready'); }
  }
  artwork.addEventListener('load', initWater);
  initWater();
})();
