const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const baseUrl = process.env.SECTION00_BASE_URL || 'http://127.0.0.1:8099/';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve(process.env.SECTION00_ARTIFACT_DIR || 'artifacts/section-00');
const knownBaselineHttpErrors = new Set(['/assets/images/about-canpolat.webp']);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const viewports = [
  [320, 568],
  [360, 800],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];

fs.mkdirSync(outputDir, { recursive: true });

function fail(list, viewport, message) {
  list.push(`${viewport}: ${message}`);
}

async function scanAxe(page, selector) {
  const result = await page.evaluate(async (targetSelector) => {
    const target = document.querySelector(targetSelector);
    if (!target || !window.axe) return { missing: true, serious: [] };
    const audit = await window.axe.run(target, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
      },
      resultTypes: ['violations'],
    });
    return {
      missing: false,
      serious: audit.violations
        .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
        .map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          targets: violation.nodes.map((node) => node.target.join(' ')),
        })),
    };
  }, selector);
  return result;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
  });

  const failures = [];
  const report = [];

  try {
    for (const [width, height] of viewports) {
      const label = `${width}x${height}`;
      const page = await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width <= 767, hasTouch: width <= 991 });

      const consoleErrors = [];
      const pageErrors = [];
      const failedRequests = [];
      const httpErrors = [];
      const accessibility = { header: null, mobileMenu: null, reducedMotion: null };

      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('requestfailed', (request) => {
        const failure = request.failure();
        failedRequests.push(`${request.url()} :: ${failure ? failure.errorText : 'unknown'}`);
      });
      page.on('response', (response) => {
        if (response.status() >= 400) {
          const url = new URL(response.url());
          httpErrors.push({ status: response.status(), path: url.pathname, url: response.url() });
        }
      });

      const response = await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });
      if (!response || !response.ok()) fail(failures, label, `Ana sayfa HTTP ${response ? response.status() : 'yok'}`);

      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.addScriptTag({ content: axeSource });

      const state = await page.evaluate(() => {
        const rootStyle = getComputedStyle(document.documentElement);
        const header = document.querySelector('.site-header');
        const nav = document.querySelector('.main-nav');
        const actions = document.querySelector('.header-actions');
        const hamburger = document.querySelector('#menu-toggle');
        const phoneRound = document.querySelector('.phone-round');
        const phoneBox = document.querySelector('.phone-box');
        const phoneLabel = document.querySelector('.phone-box__label');
        const brandImage = document.querySelector('.brand__img');
        const theme = document.querySelector('meta[name="theme-color"]');
        const rect = (el) => el ? el.getBoundingClientRect().toJSON() : null;
        const visible = (el) => !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';

        return {
          viewportWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bg: rootStyle.getPropertyValue('--color-bg').trim().toLowerCase(),
          orange: rootStyle.getPropertyValue('--color-orange').trim().toLowerCase(),
          theme: theme ? theme.getAttribute('content') : null,
          pageHas247: document.body.innerText.includes('7/24'),
          phoneLabel: phoneLabel ? phoneLabel.textContent.trim() : null,
          header: rect(header),
          navVisible: visible(nav),
          actionsVisible: visible(actions),
          hamburgerVisible: visible(hamburger),
          phoneRoundVisible: visible(phoneRound),
          hamburger: rect(hamburger),
          phoneRound: rect(phoneRound),
          phoneHref: phoneBox ? phoneBox.getAttribute('href') : null,
          brandAlt: brandImage ? brandImage.getAttribute('alt') : null,
          section00Loaded: [...document.styleSheets].some((sheet) => (sheet.href || '').includes('/css/section-00.css')),
        };
      });

      if (state.scrollWidth > state.viewportWidth + 1) fail(failures, label, `Yatay taşma var: scrollWidth=${state.scrollWidth}, viewport=${state.viewportWidth}`);
      if (state.bg !== '#253349') fail(failures, label, `--color-bg beklenen #253349, gelen ${state.bg}`);
      if (state.orange !== '#ef7c00') fail(failures, label, `--color-orange beklenen #ef7c00, gelen ${state.orange}`);
      if (state.theme !== '#253349') fail(failures, label, `theme-color beklenen #253349, gelen ${state.theme}`);
      if (state.phoneLabel !== 'Bizi Arayın') fail(failures, label, `Header telefon etiketi beklenen “Bizi Arayın”, gelen “${state.phoneLabel}”.`);
      if (!state.section00Loaded) fail(failures, label, 'css/section-00.css yüklenmedi.');
      if (state.phoneHref !== 'tel:+905359120691') fail(failures, label, `Telefon bağlantısı değişmiş: ${state.phoneHref}`);
      if (state.brandAlt !== 'Canpolat Nakliyat') fail(failures, label, `Logo alt metni beklenmedik: ${state.brandAlt}`);
      if (!state.header || state.header.left < -0.5 || state.header.right > state.viewportWidth + 0.5) fail(failures, label, 'Header viewport dışına taşıyor.');

      accessibility.header = await scanAxe(page, '.site-header');
      if (accessibility.header.missing) fail(failures, label, 'Header axe erişilebilirlik taraması çalıştırılamadı.');
      if (accessibility.header.serious.length) {
        fail(failures, label, `Header serious/critical axe ihlali: ${accessibility.header.serious.map((item) => `${item.id}(${item.impact})`).join(', ')}`);
      }

      if (width <= 991) {
        if (!state.hamburgerVisible || !state.phoneRoundVisible) fail(failures, label, 'Mobil/tablet header kontrolleri görünür değil.');
        for (const [name, target] of [['hamburger', state.hamburger], ['telefon', state.phoneRound]]) {
          if (!target || target.width < 44 || target.height < 44) fail(failures, label, `${name} dokunma hedefi 44x44 altında.`);
        }

        await page.click('#menu-toggle');
        await new Promise((resolve) => setTimeout(resolve, 320));
        const menuState = await page.evaluate(() => {
          const toggle = document.querySelector('#menu-toggle');
          const menu = document.querySelector('#mobile-menu');
          const active = document.activeElement;
          const rect = menu ? menu.getBoundingClientRect() : null;
          const links = menu ? [...menu.querySelectorAll('a,button')].filter((el) => getComputedStyle(el).display !== 'none') : [];
          const undersized = links.filter((el) => {
            const r = el.getBoundingClientRect();
            return r.height < 44;
          }).map((el) => el.textContent.trim() || el.getAttribute('aria-label') || el.tagName);
          return {
            expanded: toggle ? toggle.getAttribute('aria-expanded') : null,
            hidden: menu ? menu.getAttribute('aria-hidden') : null,
            rect: rect ? rect.toJSON() : null,
            focusInside: !!(menu && active && menu.contains(active)),
            undersized,
          };
        });
        if (menuState.expanded !== 'true' || menuState.hidden !== 'false') fail(failures, label, 'Mobil menü ARIA açık durumu yanlış.');
        if (!menuState.focusInside) fail(failures, label, 'Mobil menü açıldığında odak menü içine taşınmadı.');
        if (menuState.rect && (menuState.rect.left < -0.5 || menuState.rect.right > state.viewportWidth + 0.5)) fail(failures, label, 'Mobil menü viewport dışına taşıyor.');
        if (menuState.undersized.length) fail(failures, label, `Mobil menüde 44px altı hedefler: ${menuState.undersized.join(', ')}`);

        accessibility.mobileMenu = await scanAxe(page, '#mobile-menu');
        if (accessibility.mobileMenu.missing) fail(failures, label, 'Mobil menü axe erişilebilirlik taraması çalıştırılamadı.');
        if (accessibility.mobileMenu.serious.length) {
          fail(failures, label, `Mobil menü serious/critical axe ihlali: ${accessibility.mobileMenu.serious.map((item) => `${item.id}(${item.impact})`).join(', ')}`);
        }

        await page.keyboard.press('Escape');
        await new Promise((resolve) => setTimeout(resolve, 300));
        const closed = await page.evaluate(() => ({
          expanded: document.querySelector('#menu-toggle')?.getAttribute('aria-expanded'),
          hidden: document.querySelector('#mobile-menu')?.getAttribute('aria-hidden'),
          focusReturned: document.activeElement === document.querySelector('#menu-toggle'),
        }));
        if (closed.expanded !== 'false' || closed.hidden !== 'true' || !closed.focusReturned) fail(failures, label, 'Escape sonrası mobil menü kapanma/focus dönüşü başarısız.');
      } else {
        if (!state.navVisible || !state.actionsVisible) fail(failures, label, 'Masaüstü navigasyon veya header aksiyonları görünür değil.');
      }

      if (width === 390 && height === 844) {
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        accessibility.reducedMotion = await page.evaluate(() => {
          const header = document.querySelector('.site-header');
          const menu = document.querySelector('#mobile-menu');
          return {
            matches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            headerTransitionDuration: header ? getComputedStyle(header).transitionDuration : null,
            menuTransitionDuration: menu ? getComputedStyle(menu).transitionDuration : null,
          };
        });
        if (!accessibility.reducedMotion.matches) fail(failures, label, 'prefers-reduced-motion emülasyonu etkinleşmedi.');
        if (accessibility.reducedMotion.headerTransitionDuration !== '0s') fail(failures, label, `Reduced-motion header transition devam ediyor: ${accessibility.reducedMotion.headerTransitionDuration}`);
        if (accessibility.reducedMotion.menuTransitionDuration !== '0s') fail(failures, label, `Reduced-motion mobil menü transition devam ediyor: ${accessibility.reducedMotion.menuTransitionDuration}`);
      }

      const unexpectedHttpErrors = httpErrors.filter((item) => !knownBaselineHttpErrors.has(item.path));
      const baselineHttpErrors = httpErrors.filter((item) => knownBaselineHttpErrors.has(item.path));
      const meaningfulConsoleErrors = consoleErrors.filter((message) => {
        const genericResource404 = message.includes('Failed to load resource') && message.includes('404');
        return !(genericResource404 && baselineHttpErrors.length > 0 && unexpectedHttpErrors.length === 0);
      });

      if (meaningfulConsoleErrors.length) fail(failures, label, `Console error: ${meaningfulConsoleErrors.join(' | ')}`);
      if (pageErrors.length) fail(failures, label, `Page error: ${pageErrors.join(' | ')}`);
      if (failedRequests.length) fail(failures, label, `Başarısız ağ isteği: ${failedRequests.join(' | ')}`);
      if (unexpectedHttpErrors.length) fail(failures, label, `Yeni HTTP hata yanıtı: ${unexpectedHttpErrors.map((item) => `${item.status} ${item.path}`).join(' | ')}`);

      const screenshot = path.join(outputDir, `section-00-${label}.png`);
      await page.screenshot({ path: screenshot, fullPage: false });
      report.push({
        label,
        screenshot: path.basename(screenshot),
        state,
        accessibility,
        consoleErrors,
        pageErrors,
        failedRequests,
        httpErrors,
        baselineHttpErrors,
        unexpectedHttpErrors,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify({
    baseUrl,
    knownBaselineHttpErrors: [...knownBaselineHttpErrors],
    viewports: report,
    failures,
  }, null, 2));

  if (failures.length) {
    console.error('BÖLÜM 00 BROWSER QA FAIL');
    failures.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
  }

  console.log('BÖLÜM 00 BROWSER QA PASS');
  console.log(`- ${viewports.length} viewport doğrulandı`);
  console.log('- Yatay taşma: 0');
  console.log('- Bölüm 00 kaynaklı console/page/network hatası: 0');
  console.log('- Header ve mobil menü serious/critical axe ihlali: 0');
  console.log('- Mobil menü ARIA/focus/Escape kontrolleri başarılı');
  console.log('- prefers-reduced-motion doğrulandı');
  console.log('- Bilinen baseline: /assets/images/about-canpolat.webp 404 (Bölüm 03 kapsamında ele alınacak)');
})();
