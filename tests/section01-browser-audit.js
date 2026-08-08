const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const baseUrl = process.env.SECTION01_BASE_URL || 'http://127.0.0.1:8099/';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve(process.env.SECTION01_ARTIFACT_DIR || 'artifacts/section-01');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const knownBaselineHttpErrors = new Set(['/assets/images/about-canpolat.webp']);

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

function addFailure(failures, label, message) {
  failures.push(`${label}: ${message}`);
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
      await page.setViewport({
        width,
        height,
        deviceScaleFactor: 1,
        isMobile: width <= 767,
        hasTouch: width <= 991,
      });

      const consoleErrors = [];
      const pageErrors = [];
      const requestFailures = [];
      const httpErrors = [];

      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('requestfailed', (request) => {
        const failure = request.failure();
        requestFailures.push(`${request.url()} :: ${failure ? failure.errorText : 'unknown'}`);
      });
      page.on('response', (response) => {
        if (response.status() >= 400) {
          const url = new URL(response.url());
          httpErrors.push({ status: response.status(), path: url.pathname, url: response.url() });
        }
      });

      const response = await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });
      if (!response || !response.ok()) {
        addFailure(failures, label, `Ana sayfa HTTP ${response ? response.status() : 'yanıt yok'}`);
      }

      await page.waitForFunction(() => {
        const hero = document.querySelector('.hero-r8');
        const layers = [...document.querySelectorAll('.hero-r8__layer')];
        if (!hero || layers.length !== 13 || !hero.classList.contains('is-ready')) return false;
        return layers.every((layer) => {
          const style = getComputedStyle(layer);
          return layer.classList.contains('is-loaded') &&
            !layer.classList.contains('is-missing') &&
            layer.naturalWidth > 0 &&
            Number.parseFloat(style.opacity) >= 0.99;
        });
      }, { timeout: 10000 });

      // Son katmanın final transform/opacity durumuna tamamen yerleşmesini bekle.
      await new Promise((resolve) => setTimeout(resolve, 220));
      await page.addScriptTag({ content: axeSource });

      const state = await page.evaluate(() => {
        const heroSection = document.querySelector('.hero');
        const stage = document.querySelector('.hero-r8');
        const media = document.querySelector('.hero__media');
        const badge = document.querySelector('.hero__badge');
        const h1 = document.querySelector('.hero h1');
        const text = document.querySelector('.hero__text');
        const trust = [...document.querySelectorAll('.hero__trust .trust-item')].map((item) => item.textContent.replace(/\s+/g, ' ').trim());
        const primary = document.querySelector('.hero__actions .btn--primary');
        const whatsapp = document.querySelector('.hero__actions a[href^="https://wa.me/"]');
        const layers = [...document.querySelectorAll('.hero-r8__layer')];
        const rect = (el) => el ? el.getBoundingClientRect().toJSON() : null;
        const visible = (el) => !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';

        return {
          viewportWidth: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          h1Count: document.querySelectorAll('h1').length,
          h1Text: h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : null,
          heroText: text ? text.textContent.replace(/\s+/g, ' ').trim() : null,
          heroTextAll: heroSection ? heroSection.innerText.replace(/\s+/g, ' ').trim() : null,
          trust,
          primaryHref: primary ? primary.getAttribute('href') : null,
          whatsappHref: whatsapp ? whatsapp.getAttribute('href') : null,
          whatsappTarget: whatsapp ? whatsapp.getAttribute('target') : null,
          whatsappRel: whatsapp ? whatsapp.getAttribute('rel') : null,
          badgeVisible: visible(badge),
          badgeText: badge ? badge.textContent.replace(/\s+/g, ' ').trim() : null,
          stageRole: stage ? stage.getAttribute('role') : null,
          stageAriaLabel: stage ? stage.getAttribute('aria-label') : null,
          heroRect: rect(heroSection),
          mediaRect: rect(media),
          stageRect: rect(stage),
          layerCount: layers.length,
          loadedCount: layers.filter((layer) => layer.classList.contains('is-loaded')).length,
          missingCount: layers.filter((layer) => layer.classList.contains('is-missing')).length,
          visibleLayerCount: layers.filter((layer) => {
            const style = getComputedStyle(layer);
            return style.display !== 'none' && Number.parseFloat(style.opacity) >= 0.99 && layer.naturalWidth > 0;
          }).length,
        };
      });

      if (state.scrollWidth > state.viewportWidth + 1) addFailure(failures, label, `Yatay taşma var (${state.scrollWidth} > ${state.viewportWidth}).`);
      if (state.h1Count !== 1) addFailure(failures, label, `Sayfadaki H1 sayısı ${state.h1Count}, beklenen 1.`);
      if (state.h1Text !== 'EVDEN EVE NAKLİYATTA GÜVENİN ADI') addFailure(failures, label, `Hero H1 beklenmedik: ${state.h1Text}`);
      if (state.heroText !== 'Canpolat Nakliyat olarak eşyalarınızı özenle taşıyor, süreci planlı ve düzenli şekilde yürütüyoruz.') {
        addFailure(failures, label, `Hero açıklaması beklenmedik: ${state.heroText}`);
      }
      if (state.heroTextAll.includes('Sigortalı Taşıma')) addFailure(failures, label, 'Hero içinde doğrulanmamış “Sigortalı Taşıma” ifadesi kaldı.');
      if (state.heroTextAll.includes('Zamanında Teslimat')) addFailure(failures, label, 'Hero içinde kesin “Zamanında Teslimat” ifadesi kaldı.');
      if (state.heroTextAll.includes('Hızlı Servis')) addFailure(failures, label, 'Hero içinde “Hızlı Servis” ifadesi kaldı.');
      if (JSON.stringify(state.trust) !== JSON.stringify(['Özenli Taşıma', 'Profesyonel Ekip', 'Planlı Süreç'])) {
        addFailure(failures, label, `Hero güven unsurları beklenmedik: ${state.trust.join(' | ')}`);
      }
      if (state.primaryHref !== '#iletisim') addFailure(failures, label, `Fiyat teklifi CTA href yanlış: ${state.primaryHref}`);
      if (state.whatsappHref !== 'https://wa.me/905359120691') addFailure(failures, label, `WhatsApp URL yanlış: ${state.whatsappHref}`);
      if (state.whatsappTarget !== '_blank') addFailure(failures, label, 'WhatsApp bağlantısı yeni sekme hedefini korumuyor.');
      if (!(state.whatsappRel || '').split(/\s+/).includes('noopener')) addFailure(failures, label, 'WhatsApp bağlantısında rel=noopener eksik.');
      if (state.stageRole !== 'img' || !(state.stageAriaLabel || '').includes('Canpolat Nakliyat')) addFailure(failures, label, 'R8 sahne erişilebilir adı/rolü eksik.');
      if (state.layerCount !== 13 || state.loadedCount !== 13 || state.visibleLayerCount !== 13 || state.missingCount !== 0) {
        addFailure(failures, label, `R8 final durum hatalı: layer=${state.layerCount}, loaded=${state.loadedCount}, visible=${state.visibleLayerCount}, missing=${state.missingCount}.`);
      }
      if (!state.stageRect || state.stageRect.width <= 0 || state.stageRect.height <= 0) addFailure(failures, label, 'R8 sahne ölçüsü sıfır veya bulunamadı.');
      if (width >= 992) {
        if (!state.badgeVisible) addFailure(failures, label, 'Desktop lokasyon rozeti görünür değil.');
        if (!(state.badgeText || '').includes('Yerel Hizmet')) addFailure(failures, label, `Desktop rozet metni yanlış: ${state.badgeText}`);
      }

      const axe = await page.evaluate(async () => {
        const target = document.querySelector('.hero');
        if (!target || !window.axe) return { missing: true, violations: [] };
        const result = await window.axe.run(target, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
          },
          resultTypes: ['violations'],
        });
        return {
          missing: false,
          violations: result.violations
            .filter((item) => item.impact === 'serious' || item.impact === 'critical')
            .map((item) => ({ id: item.id, impact: item.impact, help: item.help })),
        };
      });
      if (axe.missing) addFailure(failures, label, 'Hero Axe taraması çalıştırılamadı.');
      if (axe.violations.length) addFailure(failures, label, `Hero serious/critical Axe ihlali: ${axe.violations.map((item) => `${item.id}(${item.impact})`).join(', ')}`);

      let reducedMotion = null;
      if (width === 390 && height === 844) {
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        reducedMotion = await page.evaluate(() => {
          const layer = document.querySelector('.hero-r8__layer');
          const style = layer ? getComputedStyle(layer) : null;
          return {
            matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
            transitionDuration: style ? style.transitionDuration : null,
            transform: style ? style.transform : null,
          };
        });
        if (!reducedMotion.matches) addFailure(failures, label, 'prefers-reduced-motion emülasyonu etkinleşmedi.');
        if (reducedMotion.transitionDuration !== '0s') addFailure(failures, label, `Reduced-motion transition devam ediyor: ${reducedMotion.transitionDuration}`);
        if (reducedMotion.transform !== 'none') addFailure(failures, label, `Reduced-motion transform devam ediyor: ${reducedMotion.transform}`);
      }

      const unexpectedHttpErrors = httpErrors.filter((item) => !knownBaselineHttpErrors.has(item.path));
      const baselineHttpErrors = httpErrors.filter((item) => knownBaselineHttpErrors.has(item.path));
      const meaningfulConsoleErrors = consoleErrors.filter((message) => {
        const genericResource404 = message.includes('Failed to load resource') && message.includes('404');
        return !(genericResource404 && baselineHttpErrors.length && !unexpectedHttpErrors.length);
      });

      if (meaningfulConsoleErrors.length) addFailure(failures, label, `Console error: ${meaningfulConsoleErrors.join(' | ')}`);
      if (pageErrors.length) addFailure(failures, label, `Page error: ${pageErrors.join(' | ')}`);
      if (requestFailures.length) addFailure(failures, label, `Request failure: ${requestFailures.join(' | ')}`);
      if (unexpectedHttpErrors.length) addFailure(failures, label, `Yeni HTTP hata yanıtı: ${unexpectedHttpErrors.map((item) => `${item.status} ${item.path}`).join(' | ')}`);

      const screenshot = path.join(outputDir, `section-01-${label}.png`);
      await page.screenshot({ path: screenshot, fullPage: false });

      results.push({
        label,
        screenshot: path.basename(screenshot),
        state,
        axe,
        reducedMotion,
        consoleErrors,
        pageErrors,
        requestFailures,
        httpErrors,
        baselineHttpErrors,
        unexpectedHttpErrors,
      });

      await page.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(outputDir, 'report.json'),
    JSON.stringify({ baseUrl, knownBaselineHttpErrors: [...knownBaselineHttpErrors], results, failures }, null, 2),
  );

  if (failures.length) {
    console.error('BÖLÜM 01 BROWSER QA FAIL');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('BÖLÜM 01 BROWSER QA PASS');
  console.log(`- ${viewports.length} viewport doğrulandı`);
  console.log('- Her viewportta R8 13/13 final katman görünür');
  console.log('- Hero CTA ve WhatsApp bağlantıları doğru');
  console.log('- Yatay taşma: 0');
  console.log('- Hero serious/critical Axe ihlali: 0');
  console.log('- prefers-reduced-motion doğrulandı');
  console.log('- Bölüm 01 kaynaklı console/page/network hatası: 0');
})();
