const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const baseUrl = process.env.SECTION00_BASE_URL || 'http://127.0.0.1:8099/';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve(process.env.SECTION00_ARTIFACT_DIR || 'artifacts/section-00');

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

      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('requestfailed', (request) => {
        const failure = request.failure();
        failedRequests.push(`${request.url()} :: ${failure ? failure.errorText : 'unknown'}`);
      });

      const response = await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });
      if (!response || !response.ok()) fail(failures, label, `Ana sayfa HTTP ${response ? response.status() : 'yok'}`);

      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

      const state = await page.evaluate(() => {
        const rootStyle = getComputedStyle(document.documentElement);
        const header = document.querySelector('.site-header');
        const nav = document.querySelector('.main-nav');
        const actions = document.querySelector('.header-actions');
        const hamburger = document.querySelector('#menu-toggle');
        const phoneRound = document.querySelector('.phone-round');
        const phoneBox = document.querySelector('.phone-box');
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
          bodyHas247: document.body.innerText.includes('7/24'),
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
      if (state.bodyHas247) fail(failures, label, 'Doğrulanmamış 7/24 ifadesi görünür içerikte kaldı.');
      if (!state.section00Loaded) fail(failures, label, 'css/section-00.css yüklenmedi.');
      if (state.phoneHref !== 'tel:+905359120691') fail(failures, label, `Telefon bağlantısı değişmiş: ${state.phoneHref}`);
      if (state.brandAlt !== 'Canpolat Nakliyat') fail(failures, label, `Logo alt metni beklenmedik: ${state.brandAlt}`);
      if (!state.header || state.header.left < -0.5 || state.header.right > state.viewportWidth + 0.5) fail(failures, label, 'Header viewport dışına taşıyor.');

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

      if (consoleErrors.length) fail(failures, label, `Console error: ${consoleErrors.join(' | ')}`);
      if (pageErrors.length) fail(failures, label, `Page error: ${pageErrors.join(' | ')}`);
      if (failedRequests.length) fail(failures, label, `Başarısız ağ isteği: ${failedRequests.join(' | ')}`);

      const screenshot = path.join(outputDir, `section-00-${label}.png`);
      await page.screenshot({ path: screenshot, fullPage: false });
      report.push({ label, screenshot: path.basename(screenshot), state, consoleErrors, pageErrors, failedRequests });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify({ baseUrl, viewports: report, failures }, null, 2));

  if (failures.length) {
    console.error('BÖLÜM 00 BROWSER QA FAIL');
    failures.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
  }

  console.log('BÖLÜM 00 BROWSER QA PASS');
  console.log(`- ${viewports.length} viewport doğrulandı`);
  console.log('- Yatay taşma: 0');
  console.log('- Console/page error: 0');
  console.log('- Başarısız ağ isteği: 0');
  console.log('- Mobil menü ARIA/focus/Escape kontrolleri başarılı');
})();
