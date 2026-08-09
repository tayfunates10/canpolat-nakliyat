const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const baseUrl = process.env.SECTION04_BASE_URL || 'http://127.0.0.1:8099/';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve(process.env.SECTION04_ARTIFACT_DIR || 'artifacts/section-04');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const viewports = [
  [320, 568], [360, 800], [390, 844], [430, 932], [768, 1024],
  [1024, 768], [1366, 768], [1440, 900], [1920, 1080],
];
const expectedLabels = ['Adım 1', 'Adım 2', 'Adım 3', 'Adım 4'];
const expectedTitles = ['İlk İletişim', 'Planlama', 'Hazırlık & Yükleme', 'Taşıma & Teslim'];
const expectedMeta = ['Hızlı başlangıç', 'Net program', 'Düzenli hazırlık', 'Kontrollü teslim'];
const forbiddenCopy = ['Ücretsiz ekspertiz', 'güvenle aracımıza yüklüyoruz', 'montajını yapıyoruz'];

fs.mkdirSync(outputDir, { recursive: true });
const fail = (failures, label, message) => failures.push(`${label}: ${message}`);

async function runAxe(page) {
  return page.evaluate(async () => {
    const target = document.querySelector('#tasima-sureci');
    if (!target || !window.axe) return { missing: true, violations: [] };
    const audit = await window.axe.run(target, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      resultTypes: ['violations'],
    });
    return {
      missing: false,
      violations: audit.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => ({ id: v.id, impact: v.impact, help: v.help })),
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
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', (e) => pageErrors.push(e.message));
      page.on('requestfailed', (request) => failedRequests.push(`${request.url()} :: ${request.failure()?.errorText || 'unknown'}`));
      page.on('response', (response) => {
        let pathname = response.url();
        try { pathname = new URL(response.url()).pathname; } catch (_) {}
        if (response.status() >= 400) httpErrors.push(`${response.status()} ${pathname}`);
      });

      const response = await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });
      if (!response || !response.ok()) fail(failures, label, `Ana sayfa HTTP ${response ? response.status() : 'yok'}`);

      await page.evaluate(() => document.querySelector('#tasima-sureci')?.scrollIntoView({ block: 'center' }));
      await page.waitForFunction(() => document.querySelector('#tasima-sureci.process-v2')?.classList.contains('is-visible'), { timeout: 10000 });
      await new Promise((resolve) => setTimeout(resolve, 900));
      await page.addScriptTag({ content: axeSource });

      const state = await page.evaluate(() => {
        const section = document.querySelector('#tasima-sureci');
        const list = section?.querySelector('.process-v2__list');
        const cards = [...(section?.querySelectorAll('.process-v2__card') || [])];
        const labels = cards.map((card) => card.querySelector('.process-v2__step-label')?.textContent.trim() || '');
        const titles = cards.map((card) => card.querySelector('.process-v2__card-title')?.textContent.trim() || '');
        const metas = cards.map((card) => card.querySelector('.process-v2__meta')?.textContent.trim() || '');
        const iconInfo = cards.map((card) => {
          const svg = card.querySelector('.process-v2__icon svg');
          const path = svg?.querySelector('path');
          return {
            svgWidth: svg?.getBoundingClientRect().width || 0,
            svgHeight: svg?.getBoundingClientRect().height || 0,
            fill: path?.getAttribute('fill') || '',
            stroke: path?.getAttribute('stroke') || '',
          };
        });
        const cardStyles = cards.map((card) => ({
          opacity: parseFloat(getComputedStyle(card).opacity),
          transform: getComputedStyle(card).transform,
          minHeight: card.getBoundingClientRect().height,
        }));
        const listStyle = list ? getComputedStyle(list) : null;
        const beforeStyle = list ? getComputedStyle(list, '::before') : null;
        const nodeStyle = cards[0]?.querySelector('.process-v2__node') ? getComputedStyle(cards[0].querySelector('.process-v2__node')) : null;
        const cta = section?.querySelector('.process-v2__cta-link');
        return {
          viewportWidth: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          className: section?.className || '',
          sectionText: section?.innerText || '',
          title: section?.querySelector('#process-v2-title')?.textContent.trim() || '',
          lead: section?.querySelector('.process-v2__lead')?.textContent.trim() || '',
          cardCount: cards.length,
          labels,
          titles,
          metas,
          iconInfo,
          cardStyles,
          columns: listStyle ? listStyle.gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          listPaddingLeft: listStyle ? parseFloat(listStyle.paddingLeft) : 0,
          lineDisplay: beforeStyle?.display || '',
          lineWidth: beforeStyle?.width || '',
          lineHeight: beforeStyle?.height || '',
          nodeDisplay: nodeStyle?.display || '',
          ctaHref: cta?.href || '',
          ctaTarget: cta?.target || '',
          ctaRel: cta?.rel || '',
          cssLoaded: [...document.styleSheets].some((s) => (s.href || '').includes('/css/section-04.css?v=20260809-01')),
          jsLoaded: [...document.scripts].some((s) => (s.src || '').includes('/js/section-04.js?v=20260809-01')),
        };
      });

      if (!state.className.includes('process-v2') || !state.className.includes('is-visible')) fail(failures, label, 'Bölüm 04 root/reveal durumu oluşmadı.');
      if (!state.cssLoaded || !state.jsLoaded) fail(failures, label, `Bölüm 04 CSS/JS yüklenmedi (${state.cssLoaded}/${state.jsLoaded}).`);
      if (state.scrollWidth > state.viewportWidth + 1) fail(failures, label, `Yatay taşma var (${state.scrollWidth} > ${state.viewportWidth}).`);
      if (state.title !== '4 Adımda Taşıma Akışı') fail(failures, label, `Başlık yanlış: ${state.title}`);
      if (!state.lead.includes('İlk iletişimden teslim aşamasına kadar')) fail(failures, label, 'Süreç açıklaması eksik/yanlış.');
      if (state.cardCount !== 4) fail(failures, label, `Kart sayısı ${state.cardCount}, beklenen 4.`);
      if (JSON.stringify(state.labels) !== JSON.stringify(expectedLabels)) fail(failures, label, `Adım etiketleri yanlış: ${state.labels.join(' | ')}`);
      if (JSON.stringify(state.titles) !== JSON.stringify(expectedTitles)) fail(failures, label, `Kart başlıkları yanlış: ${state.titles.join(' | ')}`);
      if (JSON.stringify(state.metas) !== JSON.stringify(expectedMeta)) fail(failures, label, `Alt etiketler yanlış: ${state.metas.join(' | ')}`);
      for (const [i, icon] of state.iconInfo.entries()) {
        if (icon.svgWidth < 20 || icon.svgHeight < 20) fail(failures, label, `İkon ${i + 1} görünür boyutta değil.`);
        if (icon.fill !== 'currentColor' || icon.stroke) fail(failures, label, `İkon ${i + 1} dolu/simetrik fill ikon değil (${icon.fill}/${icon.stroke}).`);
      }
      for (const [i, card] of state.cardStyles.entries()) {
        if (card.opacity < 0.99) fail(failures, label, `Kart ${i + 1} reveal tamamlanmadı (opacity=${card.opacity}).`);
        if (card.minHeight < 125) fail(failures, label, `Kart ${i + 1} yüksekliği beklenmedik derecede küçük (${card.minHeight}).`);
      }

      const expectedColumns = width <= 767 ? 1 : width <= 1100 ? 2 : 4;
      if (state.columns !== expectedColumns) fail(failures, label, `Grid sütunu ${state.columns}, beklenen ${expectedColumns}.`);
      if (width <= 767) {
        if (state.listPaddingLeft < 40) fail(failures, label, `Mobil timeline sol alanı yetersiz (${state.listPaddingLeft}).`);
        if (state.lineDisplay === 'none' || state.nodeDisplay === 'none') fail(failures, label, 'Mobil timeline çizgisi/düğümleri görünmüyor.');
      } else if (width <= 1100) {
        if (state.lineDisplay !== 'none' || state.nodeDisplay !== 'none') fail(failures, label, 'Tablet 2x2 düzeninde yatay timeline kapatılmadı.');
      } else {
        if (state.lineDisplay === 'none' || state.nodeDisplay === 'none') fail(failures, label, 'Masaüstü ilerleme hattı/düğümleri görünmüyor.');
      }

      const expectedWa = 'https://wa.me/905359120691';
      if (!state.ctaHref.startsWith(expectedWa) || state.ctaTarget !== '_blank' || !state.ctaRel.includes('noopener')) fail(failures, label, `WhatsApp CTA yanlış: ${state.ctaHref} / ${state.ctaTarget} / ${state.ctaRel}`);
      for (const forbidden of forbiddenCopy) if (state.sectionText.includes(forbidden)) fail(failures, label, `Eski/doğrulanmamış metin kaldı: ${forbidden}`);

      const axe = await runAxe(page);
      if (axe.missing) fail(failures, label, 'Axe Bölüm 04 taraması çalıştırılamadı.');
      if (axe.violations.length) fail(failures, label, `Axe serious/critical: ${axe.violations.map((v) => `${v.id}(${v.impact})`).join(', ')}`);

      let reducedMotion = null;
      if (width === 390 && height === 844) {
        const reducedPage = await browser.newPage();
        await reducedPage.setViewport({ width, height, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
        await reducedPage.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        await reducedPage.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });
        await reducedPage.evaluate(() => document.querySelector('#tasima-sureci')?.scrollIntoView({ block: 'center' }));
        await new Promise((resolve) => setTimeout(resolve, 150));
        reducedMotion = await reducedPage.evaluate(() => {
          const section = document.querySelector('#tasima-sureci');
          const card = section?.querySelector('.process-v2__card');
          const cta = section?.querySelector('.process-v2__cta-link');
          return {
            matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
            visible: section?.classList.contains('is-visible') || false,
            cardOpacity: card ? getComputedStyle(card).opacity : null,
            cardTransition: card ? getComputedStyle(card).transitionDuration : null,
            ctaTransition: cta ? getComputedStyle(cta).transitionDuration : null,
          };
        });
        if (!reducedMotion.matches || !reducedMotion.visible || reducedMotion.cardOpacity !== '1' || reducedMotion.cardTransition !== '0s' || reducedMotion.ctaTransition !== '0s') {
          fail(failures, label, `Reduced-motion başarısız: ${JSON.stringify(reducedMotion)}`);
        }
        await reducedPage.close();
      }

      if (consoleErrors.length) fail(failures, label, `Console error: ${consoleErrors.join(' | ')}`);
      if (pageErrors.length) fail(failures, label, `Page error: ${pageErrors.join(' | ')}`);
      if (failedRequests.length) fail(failures, label, `Request failed: ${failedRequests.join(' | ')}`);
      if (httpErrors.length) fail(failures, label, `HTTP error: ${httpErrors.join(' | ')}`);

      await page.evaluate(() => { const header = document.querySelector('#site-header'); if (header) header.style.visibility = 'hidden'; });
      const sectionHandle = await page.$('#tasima-sureci');
      const screenshot = path.join(outputDir, `section-04-${label}.png`);
      if (sectionHandle) await sectionHandle.screenshot({ path: screenshot });
      else fail(failures, label, 'Bölüm 04 screenshot hedefi bulunamadı.');

      results.push({ label, screenshot: path.basename(screenshot), state, axe, reducedMotion, consoleErrors, pageErrors, failedRequests, httpErrors });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify({ baseUrl, results, failures }, null, 2));
  if (failures.length) {
    console.error('BÖLÜM 04 BROWSER QA FAIL');
    failures.forEach((item) => console.error(`- ${item}`));
    process.exit(1);
  }

  console.log('BÖLÜM 04 BROWSER QA PASS');
  console.log('- 9 viewport doğrulandı');
  console.log('- Dolu fill ikonlar, Adım 1–4 ve dört alt etiket doğrulandı');
  console.log('- Masaüstü 4 sütun / tablet 2x2 / mobil dikey timeline doğrulandı');
  console.log('- WhatsApp, Axe, reduced-motion ve yatay taşma kontrolleri başarılı');
  console.log('- Bölüm 04 kaynaklı console/page/network hatası: 0');
})();
