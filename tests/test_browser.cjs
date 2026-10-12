// Browser-only development dependencies. No packages are shipped to customers.
const { chromium, webkit } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const local = process.argv.includes('--local');
const base = local ? 'https://benevia-preview.test/Benevia/experiencia/' : 'https://japgarmando.github.io/Benevia/experiencia/';
const engine = process.env.BROWSER_ENGINE || 'chromium';
const output = path.join(root, '.qa');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  const results = [];
  async function context(options = {}) {
    const ctx = await browser.newContext(options);
    if (local) await ctx.route('https://benevia-preview.test/**', async route => {
      let relative = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/Benevia\//, '');
      if (!path.extname(relative)) relative = relative.replace(/\/?$/, '/') + 'index.html';
      const file = path.join(root, 'dist', relative);
      await route.fulfill(fs.existsSync(file) ? { status: 200, body: fs.readFileSync(file), contentType: mime[path.extname(file)] } : { status: 404, body: relative });
    });
    return ctx;
  }
  async function audit(page) {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], 'Accessibility violations');
  }
  for (const width of [1440, 768, 390, 320]) {
    const ctx = await context({ viewport: { width, height: 900 }, isMobile: width < 500, hasTouch: width < 500 });
    const page = await ctx.newPage(), errors = [], failed = [], requests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) failed.push(r.url()); });
    page.on('request', r => requests.push(r.url()));
    assert.equal((await page.goto(base, { waitUntil: 'networkidle' })).status(), 200);
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Horizontal overflow');
    assert.equal(await page.locator('.hero h1').innerText(), 'Que fluya\nlo bueno.');
    assert.equal(requests.some(url => new URL(url).origin !== new URL(base).origin), false, 'Unexpected third-party initial request');
    await audit(page);
    await page.screenshot({ path: path.join(output, `${engine}-${local ? 'local' : 'live'}-${width}-hero.png`) });
    const preview = page.locator('.poster-preview img');
    await preview.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const img = document.querySelector('.poster-preview img'); return img.complete && img.naturalWidth > 0; });
    assert.ok((await preview.boundingBox()).width > 200, 'Poster collapsed');
    assert.equal(await preview.evaluate(img => img.naturalWidth), 960);
    await page.locator('.poster-preview').click();
    assert.equal(await page.locator('#poster-dialog').evaluate(el => el.open), true);
    await page.waitForFunction(() => { const img = document.querySelector('#poster-dialog img'); return img.complete && img.naturalWidth > 0; });
    await audit(page);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.poster-preview').evaluate(el => el === document.activeElement), true);
    if (width < 500) {
      await page.locator('.menu-toggle').click();
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
      await page.locator('#mobile-menu a[href="#precios"]').click();
      assert.equal(await page.locator('#mobile-menu').isVisible(), false);
    }
    await page.locator('.pricing-intro [data-mode="delivery"]').click();
    for (const [liters, price] of [[20, '$40.00'], [11, '$25.00'], [10, '$20.00'], [5, 'Consultar']]) assert.ok((await page.locator(`[data-price="${liters}"]`).innerText()).includes(price));
    await page.locator('[data-product="20"]').click();
    assert.equal(await page.locator('#order-dialog').evaluate(el => el.open), true);
    await page.locator('#qty-20').fill('2');
    await page.locator('#qty-11').fill('1');
    await page.locator('#qty-10').fill('3');
    assert.ok((await page.locator('#order-total').innerText()).includes('$165.00'));
    const href = new URL(await page.locator('#order-send').getAttribute('href'));
    assert.equal(href.origin + href.pathname, 'https://wa.me/525561362046');
    assert.ok(href.searchParams.get('text').includes('Total de agua: $165.00 MXN.'));
    assert.ok(href.searchParams.get('text').includes('a domicilio'));
    await page.locator('#qty-5').fill('1');
    assert.equal(await page.locator('#order-total').innerText(), 'Por confirmar');
    assert.ok((await page.locator('#order-note').innerText()).includes('$165.00'));
    await page.locator('#order-dialog [data-mode="plant"]').click();
    assert.ok((await page.locator('#order-total').innerText()).includes('$140.00'));
    await audit(page);
    await page.screenshot({ path: path.join(output, `${engine}-${local ? 'local' : 'live'}-${width}-order.png`) });
    // Native dialogs may pass through browser chrome before cycling back.
    await page.locator('#clear-order').focus();
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement === document.body)) await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#order-dialog')), true);
    assert.equal(await page.locator('#order-dialog').evaluate(el => el.scrollWidth > el.clientWidth), false, 'Dialog horizontal overflow');
    await page.locator('#qty-20').fill('25');
    assert.equal(await page.locator('#qty-20').inputValue(), '20');
    assert.equal(await page.locator('[data-step="1"][data-liters="20"]').isDisabled(), true);
    await page.locator('#clear-order').click();
    assert.equal(await page.locator('#order-send').getAttribute('href'), null);
    await page.keyboard.press('Escape');
    await page.locator('.hero-actions [data-order-open]').click();
    assert.equal(await page.locator('#order-dialog [data-mode="delivery"]').getAttribute('aria-pressed'), 'true');
    assert.ok((await page.locator('#order-total').innerText()).includes('$40.00'));
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('.footer-motion').click();
    assert.equal(await page.locator('html').getAttribute('data-motion'), 'paused');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('html').getAttribute('data-motion'), 'paused');
    assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    results.push({ viewport: width, responsive: true, pricesAndOrder: true, poster: true, keyboard: true, motionPersistence: true, axeViolations: 0, runtimeErrors: errors, failedAssets: failed });
    await ctx.close();
  }
  for (const scenario of ['reduced-motion', 'no-javascript', 'no-webgl']) {
    const ctx = await context({ viewport: { width: 390, height: 844 }, reducedMotion: scenario === 'reduced-motion' ? 'reduce' : 'no-preference', javaScriptEnabled: scenario !== 'no-javascript' });
    if (scenario === 'no-webgl') await ctx.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type === 'webgl' ? null : original.call(this, type, ...args); }; });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    if (scenario === 'reduced-motion') {
      assert.equal(await page.locator('html').getAttribute('data-motion'), 'paused');
      assert.equal(await page.locator('.flow-track').evaluate(el => getComputedStyle(el).animationName), 'none');
      assert.equal(await page.locator('#water-canvas').isVisible(), false);
    }
    if (scenario === 'no-javascript') {
      assert.equal(await page.locator('.pricing-intro .mode-control').isVisible(), false);
      assert.ok((await page.locator('[data-price="20"]').innerText()).includes('$35.00'));
      assert.ok((await page.locator('[data-product="20"]').getAttribute('href')).startsWith('https://wa.me/525561362046'));
    }
    assert.ok(await page.locator('#water-image').evaluate(img => img.complete && img.naturalWidth > 0));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    results.push({ scenario, passed: true });
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(output, `${engine}-${local ? 'local' : 'live'}-results.json`), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
