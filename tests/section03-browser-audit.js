const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const baseUrl = process.env.SECTION03_BASE_URL || 'http://127.0.0.1:8099/';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve(process.env.SECTION03_ARTIFACT_DIR || 'artifacts/section-03');
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

const visualItemsExpected = ['Yerel Deneyim', 'Planlı Organizasyon', 'Özenli Paketleme', 'Doğrudan İletişim'];
const serviceItemsExpected = ['Evden Eve Nakliyat', 'Şehirler Arası Taşıma', 'Asansörlü Taşıma', 'Ofis ve İşyeri Taşıma'];
const forbiddenCopy = ['Sigortalı Taşıma', 'Zamanında Teslimat', '7/24 Destek', 'yılların deneyimi'];

fs.mkdirSync(outputDir, { recursive: true });

function fail(failures, label, message) {
  failures.push(`${label}: ${message}`);
}

async function runAxe(page) {
  return page.evaluate(async () => {
    const target = document.querySelector('#hakkimizda');
    if (!target || !window.axe) return { missing: true, violations: [] };
    const audit = await window.axe.run(target, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
      },
      resultTypes: ['violations'],
    });
    return {
      missing: false,
      violations: audit.violations
        .filter((item) => item.impact === 'serious' || item.impact === 'critical')
        .map((item) => ({ id: item.id, impact: item.impact, help: item.help })),
    };
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
  });

  const failures = [];
  const results = [];

  try {
    for (const [width, height] of viewports) {
      const label = `${width}x${height}`;
      const page = await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width <= 767, hasTouch: width <= 991 });

      const consoleErrors = [];
      const pageErrors = [];
      const failedRequests = [];
      const httpErrors = [];
      const requestedPaths = [];

      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('request', (request) => {
        try { requestedPaths.push(new URL(request.url()).pathname); } catch (_) {}
      });
      page.on('requestfailed', (request) => {
        const failure = request.failure();
        failedRequests.push(`${request.url()} :: ${failure ? failure.errorText : 'unknown'}`);
      });
      page.on('response', (response) => {
        if (response.status() >= 400) {
          let pathname = response.url();
          try { pathname = new URL(response.url()).pathname; } catch (_) {}
          httpErrors.push(`${response.status()} ${pathname}`);
        }
      });

      const response = await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });
      if (!response || !response.ok()) fail(failures, label, `Ana sayfa HTTP ${response ? response.status() : 'yok'}`);

      await page.evaluate(() => document.querySelector('#hakkimizda')?.scrollIntoView({ block: 'center' }));

      await page.waitForFunction(() => {
        const section = document.querySelector('#hakkimizda.about-v2');
        if (!section) return false;
        const logo = section.querySelector('.about-v2__logo');
        const layers = [...section.querySelectorAll('.about-v2__r8-layer')];
        return !!logo && logo.complete && logo.naturalWidth > 0 &&
          layers.length === 7 && layers.every((img) => img.complete && img.naturalWidth > 0);
      }, { timeout: 15000 });

      await page.waitForFunction(() => {
        const section = document.querySelector('#hakkimizda.about-v2');
        return !!section && section.classList.contains('is-visible');
      }, { timeout: 10000 });

      await new Promise((resolve) => setTimeout(resolve, 1250));
      await page.addScriptTag({ content: axeSource });

      const state = await page.evaluate(() => {
        const section = document.querySelector('#hakkimizda');
        const inner = section?.querySelector('.about-v2__inner');
        const visual = section?.querySelector('.about-v2__visual');
        const scene = section?.querySelector('.about-v2__scene');
        const brand = section?.querySelector('.about-v2__brand-overlay');
        const logo = section?.querySelector('.about-v2__logo');
        const pin = section?.querySelector('.about-v2__pin-wrap');
        const route = section?.querySelector('.about-v2__route-line');
        const bar = section?.querySelector('.about-v2__visual-bar');
        const services = section?.querySelector('.about-v2__services');
        const r8Layers = [...(section?.querySelectorAll('.about-v2__r8-layer') || [])];
        const visualItems = [...(section?.querySelectorAll('.about-v2__visual-item strong') || [])].map((el) => el.textContent.trim());
        const serviceItems = [...(section?.querySelectorAll('.about-v2__service strong') || [])].map((el) => el.textContent.trim());
        const sectionRect = section?.getBoundingClientRect();
        const visualRect = visual?.getBoundingClientRect();
        const sceneRect = scene?.getBoundingClientRect();
        const pinRect = pin?.getBoundingClientRect();
        const brandStyle = brand ? getComputedStyle(brand) : null;
        const pinStyle = pin ? getComputedStyle(pin) : null;
        const routeStyle = route ? getComputedStyle(route) : null;
        const stylesheetLoaded = [...document.styleSheets].some((sheet) => (sheet.href || '').includes('/css/section-03.css?v=20260809-01'));
        const resources = performance.getEntriesByType('resource').map((entry) => new URL(entry.name, location.href).pathname);

        return {
          viewportWidth: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          sectionClass: section?.className || '',
          sectionText: section?.innerText || '',
          sectionRect: sectionRect?.toJSON() || null,
          visualRect: visualRect?.toJSON() || null,
          sceneRect: sceneRect?.toJSON() || null,
          pinRect: pinRect?.toJSON() || null,
          innerColumns: inner ? getComputedStyle(inner).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          visualBarColumns: bar ? getComputedStyle(bar).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          serviceColumns: services ? getComputedStyle(services).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          stylesheetLoaded,
          logoLoaded: !!(logo && logo.complete && logo.naturalWidth > 0),
          logoSrc: logo ? new URL(logo.src).pathname : '',
          r8Count: r8Layers.length,
          r8Loaded: r8Layers.every((img) => img.complete && img.naturalWidth > 0),
          t00Used: r8Layers.some((img) => img.src.includes('/hero-r8/truck-t00-r6.png')),
          brandOpacity: brandStyle ? Number.parseFloat(brandStyle.opacity) : -1,
          pinOpacity: pinStyle ? Number.parseFloat(pinStyle.opacity) : -1,
          routeDashOffset: routeStyle ? routeStyle.strokeDashoffset : null,
          visualItems,
          serviceItems,
          brandCopy: section?.querySelector('.about-v2__brand-copy')?.innerText.trim() || '',
          title: section?.querySelector('#about-v2-title')?.innerText.trim() || '',
          resources,
        };
      });

      if (!state.sectionClass.includes('about-v2')) fail(failures, label, 'Yeni Hakkımızda partial render edilmedi.');
      if (!state.sectionClass.includes('is-visible')) fail(failures, label, 'Hakkımızda viewport reveal durumu oluşmadı.');
      if (!state.stylesheetLoaded) fail(failures, label, 'Bölüm 03 CSS cache-bust sürümü yüklenmedi.');
      if (state.scrollWidth > state.viewportWidth + 1) fail(failures, label, `Yatay taşma var (${state.scrollWidth} > ${state.viewportWidth}).`);
      if (!state.logoLoaded || state.logoSrc !== '/assets/images/canpolat-logo.svg') fail(failures, label, `Gerçek logo yüklenmedi: ${state.logoSrc}`);
      if (state.r8Count !== 7 || !state.r8Loaded || !state.t00Used) fail(failures, label, 'Onaylı T00 + 7 R8 katmanlı görsel sahnesi tam yüklenmedi.');
      if (state.brandOpacity < 0.99) fail(failures, label, `Logo/açıklama reveal tamamlanmadı (opacity=${state.brandOpacity}).`);
      if (state.pinOpacity < 0.99) fail(failures, label, `Edremit pini reveal tamamlanmadı (opacity=${state.pinOpacity}).`);
      if (!state.brandCopy.includes('EDREMİT VE ÇEVRESİNDE') || !state.brandCopy.includes('PLANLI TAŞIMA HİZMETLERİ')) fail(failures, label, 'Görsel üstü açıklama yanlış/eksik.');
      if (!state.title.includes('Canpolat Nakliyat') || !state.title.includes('Güvenle Taşır, Güven Kazanır')) fail(failures, label, 'Hakkımızda başlığı beklenen içerikte değil.');

      const expectedInnerColumns = width <= 991 ? 1 : 2;
      const expectedBarColumns = width <= 767 ? 2 : 4;
      const expectedServiceColumns = width <= 767 ? 1 : 2;
      if (state.innerColumns !== expectedInnerColumns) fail(failures, label, `Ana grid sütunu ${state.innerColumns}, beklenen ${expectedInnerColumns}.`);
      if (state.visualBarColumns !== expectedBarColumns) fail(failures, label, `Görsel altı ikon grid sütunu ${state.visualBarColumns}, beklenen ${expectedBarColumns}.`);
      if (state.serviceColumns !== expectedServiceColumns) fail(failures, label, `Paragraf altı hizmet grid sütunu ${state.serviceColumns}, beklenen ${expectedServiceColumns}.`);

      if (JSON.stringify(state.visualItems) !== JSON.stringify(visualItemsExpected)) fail(failures, label, `Görsel altı içerikler yanlış: ${state.visualItems.join(' | ')}`);
      if (JSON.stringify(state.serviceItems) !== JSON.stringify(serviceItemsExpected)) fail(failures, label, `Paragraf altı hizmet içerikleri yanlış: ${state.serviceItems.join(' | ')}`);
      if (state.visualItems.some((item) => state.serviceItems.includes(item))) fail(failures, label, 'İki ikon grubu birbirinden farklı değil.');

      for (const forbidden of forbiddenCopy) {
        if (state.sectionText.includes(forbidden)) fail(failures, label, `Eski/doğrulanmamış Hakkımızda metni görünür kaldı: ${forbidden}`);
      }

      if (requestedPaths.includes('/assets/images/about-canpolat.webp') || state.resources.includes('/assets/images/about-canpolat.webp')) {
        fail(failures, label, 'Eski about-canpolat.webp isteği hâlâ yapılıyor.');
      }

      if (!state.visualRect || state.visualRect.width < 1 || state.visualRect.height < 200) fail(failures, label, 'Hakkımızda görsel paneli görünür değil.');
      if (!state.pinRect || !state.sceneRect || state.pinRect.left < state.sceneRect.left - 1 || state.pinRect.right > state.sceneRect.right + 1) fail(failures, label, 'Edremit pini görsel güvenli alanının dışında.');

      const axe = await runAxe(page);
      if (axe.missing) fail(failures, label, 'Axe Hakkımızda taraması çalıştırılamadı.');
      if (axe.violations.length) fail(failures, label, `Serious/critical Axe ihlali: ${axe.violations.map((v) => `${v.id}(${v.impact})`).join(', ')}`);

      let reducedMotion = null;
      if (width === 390 && height === 844) {
        const reducedPage = await browser.newPage();
        await reducedPage.setViewport({ width, height, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
        await reducedPage.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        await reducedPage.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });
        await reducedPage.evaluate(() => document.querySelector('#hakkimizda')?.scrollIntoView({ block: 'center' }));
        await new Promise((resolve) => setTimeout(resolve, 200));
        reducedMotion = await reducedPage.evaluate(() => {
          const brand = document.querySelector('.about-v2__brand-overlay');
          const pin = document.querySelector('.about-v2__pin-wrap');
          const route = document.querySelector('.about-v2__route-line');
          const service = document.querySelector('.about-v2__service');
          return {
            matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
            brandOpacity: brand ? getComputedStyle(brand).opacity : null,
            brandTransition: brand ? getComputedStyle(brand).transitionDuration : null,
            pinTransition: pin ? getComputedStyle(pin).transitionDuration : null,
            serviceTransition: service ? getComputedStyle(service).transitionDuration : null,
            routeAnimation: route ? getComputedStyle(route).animationName : null,
            routeDash: route ? getComputedStyle(route).strokeDashoffset : null,
          };
        });
        await reducedPage.close();
        if (!reducedMotion.matches) fail(failures, label, 'prefers-reduced-motion etkinleşmedi.');
        if (reducedMotion.brandOpacity !== '1') fail(failures, label, `Reduced-motion logo görünür değil: ${reducedMotion.brandOpacity}`);
        if (reducedMotion.brandTransition !== '0s' || reducedMotion.pinTransition !== '0s' || reducedMotion.serviceTransition !== '0s') fail(failures, label, 'Reduced-motion transition tamamen kapanmadı.');
        if (reducedMotion.routeAnimation !== 'none') fail(failures, label, `Reduced-motion rota animasyonu devam ediyor: ${reducedMotion.routeAnimation}`);
      }

      if (consoleErrors.length) fail(failures, label, `Console error: ${consoleErrors.join(' | ')}`);
      if (pageErrors.length) fail(failures, label, `Page error: ${pageErrors.join(' | ')}`);
      if (failedRequests.length) fail(failures, label, `Başarısız ağ isteği: ${failedRequests.join(' | ')}`);
      if (httpErrors.length) fail(failures, label, `HTTP hata yanıtı: ${httpErrors.join(' | ')}`);

      /*
       * QA ekran görüntüsünde fixed/sticky header element crop üzerine binmesin.
       * Testlerin tamamı gerçek header davranışı açıkken yukarıda çalıştırılır;
       * yalnız final section screenshot'ı için görünürlüğü geçici kapatılır.
       */
      await page.evaluate(() => {
        const header = document.querySelector('#site-header');
        if (header) header.dataset.qaPreviousVisibility = header.style.visibility || '';
        if (header) header.style.visibility = 'hidden';
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const sectionHandle = await page.$('#hakkimizda');
      const screenshot = path.join(outputDir, `section-03-${label}.png`);
      if (sectionHandle) await sectionHandle.screenshot({ path: screenshot });
      else fail(failures, label, 'Hakkımızda bölümü screenshot için bulunamadı.');

      await page.evaluate(() => {
        const header = document.querySelector('#site-header');
        if (!header) return;
        header.style.visibility = header.dataset.qaPreviousVisibility || '';
        delete header.dataset.qaPreviousVisibility;
      });

      results.push({ label, screenshot: path.basename(screenshot), state, axe, reducedMotion, consoleErrors, pageErrors, failedRequests, httpErrors });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify({ baseUrl, results, failures }, null, 2));

  if (failures.length) {
    console.error('BÖLÜM 03 BROWSER QA FAIL');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('BÖLÜM 03 BROWSER QA PASS');
  console.log('- 9 viewport doğrulandı');
  console.log('- Gerçek logo + onaylı T00/R8 görsel sahnesi yüklendi');
  console.log('- Logo/açıklama ve Edremit pin viewport efektleri doğrulandı');
  console.log('- Görsel altı ve paragraf altı iki farklı ikon grubu doğrulandı');
  console.log('- Eski about-canpolat.webp isteği: 0');
  console.log('- Yatay taşma: 0');
  console.log('- Serious/critical Axe ihlali: 0');
  console.log('- prefers-reduced-motion doğrulandı');
  console.log('- Bölüm 03 kaynaklı console/page/network hatası: 0');
})();
