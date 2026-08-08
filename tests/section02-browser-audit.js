const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const baseUrl = process.env.SECTION02_BASE_URL || 'http://127.0.0.1:8099/';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve(process.env.SECTION02_ARTIFACT_DIR || 'artifacts/section-02');
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

const expectedUrls = [
  '/hizmetler/evden-eve-nakliyat.html',
  '/hizmetler/sehirler-arasi-nakliyat.html',
  '/hizmetler/ofis-isyeri-tasima.html',
  '/hizmetler/asansorlu-tasima.html',
  '/hizmetler/paketleme-montaj.html',
];

const expectedTitles = [
  'Evden Eve Nakliyat',
  'Şehirler Arası Nakliyat',
  'Ofis Taşıma',
  'Asansörlü Taşıma',
  'Paketleme & Montaj',
];

const expectedTexts = [
  'Eşyalarınızı özenle paketleyip planlı şekilde yeni adresinize taşıyoruz.',
  'Şehirler arası taşıma sürecini rota ve eşya durumuna göre planlıyoruz.',
  'Ofis ve iş yeri taşımalarını iş akışını gözeterek düzenli şekilde yürütüyoruz.',
  'Bina ve çevre koşulları uygunsa dış cephe taşıma asansörü kullanıyoruz.',
  'Taşıma kapsamına uygun paketleme ve yeniden kurulum desteği sağlıyoruz.',
];

const forbiddenVisibleCopy = [
  'Türkiye\'nin her yerine güvenli, planlı ve zamanında taşıma hizmeti.',
  'en kısa sürede yeni adresinize taşıyoruz',
  'hızlı, güvenli ve hasarsız taşıma',
  'uzman montaj ekibimizle',
];

fs.mkdirSync(outputDir, { recursive: true });

function addFailure(failures, label, message) {
  failures.push(`${label}: ${message}`);
}

async function runAxe(page) {
  return page.evaluate(async () => {
    const target = document.querySelector('#hizmetler');
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
      if (!response || !response.ok()) addFailure(failures, label, `Ana sayfa HTTP ${response ? response.status() : 'yok'}`);

      await page.evaluate(() => {
        document.querySelector('#hizmetler')?.scrollIntoView({ block: 'start' });
      });
      await new Promise((resolve) => setTimeout(resolve, 300));

      await page.waitForFunction(() => {
        const images = [...document.querySelectorAll('#hizmetler .service-card__media img')];
        return images.length === 5 && images.every((img) => img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
      }, { timeout: 10000 });

      await page.addScriptTag({ content: axeSource });

      const state = await page.evaluate(() => {
        const section = document.querySelector('#hizmetler');
        const grid = section?.querySelector('.services__grid');
        const cards = [...(section?.querySelectorAll('.service-card') || [])];
        const title = section?.querySelector('.section-title');
        const stylesheetLoaded = [...document.styleSheets].some((sheet) => (sheet.href || '').includes('/css/services-tune.css?v=20260809-svc-04'));
        const cardStates = cards.map((card) => {
          const media = card.querySelector('.service-card__media');
          const image = card.querySelector('.service-card__media img');
          const heading = card.querySelector('.service-card__title');
          const text = card.querySelector('.service-card__text');
          const before = getComputedStyle(card.querySelector('.service-card__body'), '::before');
          const rect = card.getBoundingClientRect();
          const mediaRect = media?.getBoundingClientRect();
          return {
            href: new URL(card.href).pathname,
            title: heading?.textContent.trim() || '',
            text: text?.textContent.trim() || '',
            tabIndex: card.tabIndex,
            rect: rect.toJSON(),
            mediaRect: mediaRect?.toJSON() || null,
            imageLoaded: !!(image && image.complete && image.naturalWidth > 0),
            imageObjectFit: image ? getComputedStyle(image).objectFit : null,
            numberContent: before.content,
          };
        });

        const gridColumns = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length : 0;
        const titleStyle = title ? getComputedStyle(title) : null;
        const sectionRect = section?.getBoundingClientRect();

        return {
          viewportWidth: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          cardCount: cards.length,
          gridColumns,
          sectionRect: sectionRect?.toJSON() || null,
          stylesheetLoaded,
          titleVisible: !!title && titleStyle.display !== 'none' && titleStyle.visibility !== 'hidden' && titleStyle.position !== 'absolute',
          serviceText: section?.innerText || '',
          cardStates,
        };
      });

      if (state.cardCount !== 5) addFailure(failures, label, `Hizmet kartı sayısı ${state.cardCount}, beklenen 5.`);
      if (!state.stylesheetLoaded) addFailure(failures, label, 'Bölüm 02 CSS cache-bust sürümü yüklenmedi.');
      if (state.scrollWidth > state.viewportWidth + 1) addFailure(failures, label, `Yatay taşma var (${state.scrollWidth} > ${state.viewportWidth}).`);

      const expectedColumns = width <= 767 ? 1 : (width <= 991 ? 3 : 5);
      if (state.gridColumns !== expectedColumns) addFailure(failures, label, `Grid sütunu ${state.gridColumns}, beklenen ${expectedColumns}.`);
      if (width <= 767 && !state.titleVisible) addFailure(failures, label, 'Mobilde Hizmetler bölüm başlığı görünür değil.');

      state.cardStates.forEach((card, index) => {
        if (card.href !== expectedUrls[index]) addFailure(failures, label, `Kart ${index + 1} URL yanlış: ${card.href}`);
        if (card.title !== expectedTitles[index]) addFailure(failures, label, `Kart ${index + 1} başlık yanlış: ${card.title}`);
        if (card.text !== expectedTexts[index]) addFailure(failures, label, `Kart ${index + 1} açıklama yanlış: ${card.text}`);
        if (card.tabIndex !== 0) addFailure(failures, label, `Kart ${index + 1} klavye ile odaklanabilir değil.`);
        if (!card.imageLoaded) addFailure(failures, label, `Kart ${index + 1} görseli yüklenmedi.`);
        if (card.imageObjectFit !== 'contain') addFailure(failures, label, `Kart ${index + 1} görsel object-fit=${card.imageObjectFit}, beklenen contain.`);
        if (card.rect.width < 1 || card.rect.height < 44) addFailure(failures, label, `Kart ${index + 1} etkileşim alanı yetersiz.`);
        if (!card.mediaRect || card.mediaRect.width < 1 || card.mediaRect.height < 1) addFailure(failures, label, `Kart ${index + 1} medya alanı görünür değil.`);
      });

      for (const forbidden of forbiddenVisibleCopy) {
        if (state.serviceText.includes(forbidden)) addFailure(failures, label, `Eski/garanti niteliğindeki metin görünür kaldı: ${forbidden}`);
      }

      const axe = await runAxe(page);
      if (axe.missing) addFailure(failures, label, 'Axe Hizmetler taraması çalıştırılamadı.');
      if (axe.violations.length) addFailure(failures, label, `Serious/critical Axe ihlali: ${axe.violations.map((v) => `${v.id}(${v.impact})`).join(', ')}`);

      let reducedMotion = null;
      if (width === 390 && height === 844) {
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        reducedMotion = await page.evaluate(() => {
          const card = document.querySelector('#hizmetler .service-card');
          const image = document.querySelector('#hizmetler .service-card__media img');
          return {
            matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
            cardTransition: card ? getComputedStyle(card).transitionDuration : null,
            imageTransition: image ? getComputedStyle(image).transitionDuration : null,
          };
        });
        if (!reducedMotion.matches) addFailure(failures, label, 'prefers-reduced-motion etkinleşmedi.');
        if (reducedMotion.cardTransition !== '0s') addFailure(failures, label, `Reduced-motion kart transition devam ediyor: ${reducedMotion.cardTransition}`);
        if (reducedMotion.imageTransition !== '0s') addFailure(failures, label, `Reduced-motion görsel transition devam ediyor: ${reducedMotion.imageTransition}`);
      }

      const unexpectedHttpErrors = httpErrors.filter((item) => !knownBaselineHttpErrors.has(item.path));
      const baselineHttpErrors = httpErrors.filter((item) => knownBaselineHttpErrors.has(item.path));
      const meaningfulConsoleErrors = consoleErrors.filter((message) => {
        const generic404 = message.includes('Failed to load resource') && message.includes('404');
        return !(generic404 && baselineHttpErrors.length > 0 && unexpectedHttpErrors.length === 0);
      });

      if (meaningfulConsoleErrors.length) addFailure(failures, label, `Console error: ${meaningfulConsoleErrors.join(' | ')}`);
      if (pageErrors.length) addFailure(failures, label, `Page error: ${pageErrors.join(' | ')}`);
      if (failedRequests.length) addFailure(failures, label, `Başarısız ağ isteği: ${failedRequests.join(' | ')}`);
      if (unexpectedHttpErrors.length) addFailure(failures, label, `Yeni HTTP hata yanıtı: ${unexpectedHttpErrors.map((item) => `${item.status} ${item.path}`).join(' | ')}`);

      const section = await page.$('#hizmetler');
      const screenshot = path.join(outputDir, `section-02-${label}.png`);
      if (section) await section.screenshot({ path: screenshot });
      else addFailure(failures, label, 'Hizmetler bölümü screenshot için bulunamadı.');

      results.push({ label, screenshot: path.basename(screenshot), state, axe, reducedMotion, httpErrors, consoleErrors, pageErrors, failedRequests });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify({ baseUrl, results, failures }, null, 2));

  if (failures.length) {
    console.error('BÖLÜM 02 BROWSER QA FAIL');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('BÖLÜM 02 BROWSER QA PASS');
  console.log('- 9 viewport doğrulandı');
  console.log('- Masaüstü 5 / tablet 3+2 / mobil tek sütun yatay kart düzeni başarılı');
  console.log('- 5/5 hizmet görseli yüklü ve object-fit: contain');
  console.log('- 5/5 detay sayfası URL’si ve güvenli hizmet metni doğru');
  console.log('- Yatay taşma: 0');
  console.log('- Serious/critical Axe ihlali: 0');
  console.log('- prefers-reduced-motion doğrulandı');
  console.log('- Bölüm 02 kaynaklı console/page/network hatası: 0');
})();
