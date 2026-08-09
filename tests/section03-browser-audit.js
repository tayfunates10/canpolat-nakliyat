const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const baseUrl = process.env.SECTION03_BASE_URL || 'http://127.0.0.1:8099/';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve(process.env.SECTION03_ARTIFACT_DIR || 'artifacts/section-03');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const viewports = [
  [320, 568], [360, 800], [390, 844], [430, 932], [768, 1024],
  [1024, 768], [1366, 768], [1440, 900], [1920, 1080],
];
const visualItemsExpected = ['Yerel Deneyim', 'Planlı Organizasyon', 'Özenli Paketleme', 'Doğrudan İletişim'];
const serviceItemsExpected = ['Evden Eve Nakliyat', 'Şehirler Arası Taşıma', 'Asansörlü Taşıma', 'Ofis ve İşyeri Taşıma'];
const forbiddenCopy = ['Sigortalı Taşıma', 'Zamanında Teslimat', '7/24 Destek', 'yılların deneyimi'];
const approvedImagePath = '/assets/images/about-canpolat-approved.php';
const expectedImageSha = '21104ece60551cfc8756097d06a5feb968f797b57086da6ad73db60e5bc6ca00';

fs.mkdirSync(outputDir, { recursive: true });
const addFailure = (failures, label, message) => failures.push(`${label}: ${message}`);

async function runAxe(page) {
  return page.evaluate(async () => {
    const target = document.querySelector('#hakkimizda');
    if (!target || !window.axe) return { missing: true, violations: [] };
    const audit = await window.axe.run(target, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
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
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'] });
  const failures = [];
  const results = [];

  try {
    for (const [width, height] of viewports) {
      const label = `${width}x${height}`;
      const page = await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width <= 767, hasTouch: width <= 991 });

      const consoleErrors = [], pageErrors = [], failedRequests = [], httpErrors = [], requestedPaths = [];
      let approvedResponse = null;
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', (e) => pageErrors.push(e.message));
      page.on('request', (r) => { try { requestedPaths.push(new URL(r.url()).pathname); } catch (_) {} });
      page.on('requestfailed', (r) => failedRequests.push(`${r.url()} :: ${r.failure()?.errorText || 'unknown'}`));
      page.on('response', (r) => {
        let pathname = r.url();
        try { pathname = new URL(r.url()).pathname; } catch (_) {}
        if (pathname === approvedImagePath) {
          const headers = r.headers();
          approvedResponse = {
            status: r.status(),
            contentType: (headers['content-type'] || '').toLowerCase(),
            cacheControl: (headers['cache-control'] || '').toLowerCase(),
            etag: headers.etag || '',
          };
        }
        if (r.status() >= 400) httpErrors.push(`${r.status()} ${pathname}`);
      });

      const response = await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });
      if (!response || !response.ok()) addFailure(failures, label, `Ana sayfa HTTP ${response ? response.status() : 'yok'}`);
      await page.evaluate(() => document.querySelector('#hakkimizda')?.scrollIntoView({ block: 'center' }));
      await page.waitForFunction(() => {
        const image = document.querySelector('#hakkimizda .about-v2__approved-image');
        const logo = document.querySelector('#hakkimizda .about-v2__logo');
        return !!image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 && !!logo && logo.complete && logo.naturalWidth > 0;
      }, { timeout: 15000 });
      await page.waitForFunction(() => document.querySelector('#hakkimizda.about-v2')?.classList.contains('is-visible'), { timeout: 10000 });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.addScriptTag({ content: axeSource });

      const state = await page.evaluate(() => {
        const section = document.querySelector('#hakkimizda');
        const inner = section?.querySelector('.about-v2__inner');
        const visual = section?.querySelector('.about-v2__visual');
        const scene = section?.querySelector('.about-v2__scene');
        const image = section?.querySelector('.about-v2__approved-image');
        const brand = section?.querySelector('.about-v2__brand-overlay');
        const logo = section?.querySelector('.about-v2__logo');
        const pin = section?.querySelector('.about-v2__pin-wrap');
        const bar = section?.querySelector('.about-v2__visual-bar');
        const services = section?.querySelector('.about-v2__services');
        const sceneRect = scene?.getBoundingClientRect();
        const pinRect = pin?.getBoundingClientRect();
        const imageRect = image?.getBoundingClientRect();
        const pinX = sceneRect && pinRect ? ((pinRect.left + pinRect.width / 2 - sceneRect.left) / sceneRect.width) : -1;
        const pinY = sceneRect && pinRect ? ((pinRect.top + pinRect.height / 2 - sceneRect.top) / sceneRect.height) : -1;

        let pixels = { nonWhite: 0, dark: 0, orange: 0 };
        if (image && image.complete && image.naturalWidth > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = 180; canvas.height = 135;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(image, 0, 0, 180, 135);
          const data = ctx.getImageData(0, 0, 180, 135).data;
          let nonWhite = 0, dark = 0, orange = 0;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r < 235 || g < 235 || b < 235) nonWhite++;
            if ((r + g + b) / 3 < 180) dark++;
            if (r > 180 && g > 65 && g < 190 && b < 150 && r - g > 35) orange++;
          }
          const total = 180 * 135;
          pixels = { nonWhite: nonWhite / total, dark: dark / total, orange: orange / total };
        }

        return {
          viewportWidth: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          sectionClass: section?.className || '',
          sectionText: section?.innerText || '',
          innerColumns: inner ? getComputedStyle(inner).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          barColumns: bar ? getComputedStyle(bar).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          serviceColumns: services ? getComputedStyle(services).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          imageSrc: image ? new URL(image.src).pathname : '',
          imageNaturalWidth: image?.naturalWidth || 0,
          imageNaturalHeight: image?.naturalHeight || 0,
          imageAttrWidth: image?.getAttribute('width') || '',
          imageAttrHeight: image?.getAttribute('height') || '',
          imageFit: image ? getComputedStyle(image).objectFit : '',
          imageRatio: imageRect ? imageRect.width / imageRect.height : 0,
          pixels,
          logoLoaded: !!(logo && logo.complete && logo.naturalWidth > 0),
          logoSrc: logo ? new URL(logo.src).pathname : '',
          brandOpacity: brand ? parseFloat(getComputedStyle(brand).opacity) : -1,
          pinOpacity: pin ? parseFloat(getComputedStyle(pin).opacity) : -1,
          pinX, pinY,
          pinLabel: pin?.innerText.trim() || '',
          visualItems: [...(section?.querySelectorAll('.about-v2__visual-item strong') || [])].map((el) => el.textContent.trim()),
          serviceItems: [...(section?.querySelectorAll('.about-v2__service strong') || [])].map((el) => el.textContent.trim()),
          brandCopy: section?.querySelector('.about-v2__brand-copy')?.innerText.trim() || '',
          title: section?.querySelector('#about-v2-title')?.innerText.trim() || '',
          visualHeight: visual?.getBoundingClientRect().height || 0,
        };
      });

      if (!state.sectionClass.includes('about-v2') || !state.sectionClass.includes('is-visible')) addFailure(failures, label, 'Hakkımızda reveal durumu oluşmadı.');
      if (state.scrollWidth > state.viewportWidth + 1) addFailure(failures, label, `Yatay taşma var (${state.scrollWidth} > ${state.viewportWidth}).`);
      if (!approvedResponse || approvedResponse.status !== 200) addFailure(failures, label, `Onaylı WebP endpoint HTTP yanıtı geçersiz: ${JSON.stringify(approvedResponse)}`);
      if (approvedResponse && !approvedResponse.contentType.includes('image/webp')) addFailure(failures, label, `Onaylı görsel MIME tipi yanlış: ${approvedResponse.contentType}`);
      if (approvedResponse && !approvedResponse.cacheControl.includes('immutable')) addFailure(failures, label, `Onaylı görsel cache politikası yanlış: ${approvedResponse.cacheControl}`);
      if (approvedResponse && !approvedResponse.etag.includes(expectedImageSha)) addFailure(failures, label, `Onaylı görsel ETag kilidi yanlış: ${approvedResponse.etag}`);
      if (state.imageSrc !== approvedImagePath) addFailure(failures, label, `Onaylı WebP endpoint üzerinden yüklenmiyor: ${state.imageSrc}`);
      if (state.imageNaturalWidth !== 900 || state.imageNaturalHeight !== 675) addFailure(failures, label, `WebP decode ölçüsü yanlış (${state.imageNaturalWidth}x${state.imageNaturalHeight}).`);
      if (state.imageAttrWidth !== '900' || state.imageAttrHeight !== '675') addFailure(failures, label, 'HTML image ölçü ipucu 900x675 değil.');
      if (state.imageFit !== 'contain' || Math.abs(state.imageRatio - 4 / 3) > 0.03) addFailure(failures, label, `Görsel 4:3 contain değil (${state.imageFit}, ${state.imageRatio}).`);
      if (state.pixels.nonWhite < 0.20 || state.pixels.dark < 0.05 || state.pixels.orange < 0.003) addFailure(failures, label, `Görsel içerik/renk doğrulaması başarısız: ${JSON.stringify(state.pixels)}`);
      if (!state.logoLoaded || state.logoSrc !== '/assets/images/canpolat-logo.svg') addFailure(failures, label, 'Gerçek logo overlay yüklenmedi.');
      if (state.brandOpacity < 0.99 || state.pinOpacity < 0.99) addFailure(failures, label, `Overlay reveal tamamlanmadı (${state.brandOpacity}/${state.pinOpacity}).`);
      if (!state.pinLabel.includes('Edremit') || !state.pinLabel.includes('Balıkesir')) addFailure(failures, label, `Konum etiketi yanlış: ${state.pinLabel}`);
      if (state.pinX < 0.40 || state.pinX > 0.56 || state.pinY < 0.18 || state.pinY > 0.40) addFailure(failures, label, `Pin Balıkesir vurgusu güvenli alanında değil (${state.pinX.toFixed(3)}, ${state.pinY.toFixed(3)}).`);
      if (!state.brandCopy.includes('EDREMİT VE ÇEVRESİNDE') || !state.brandCopy.includes('PLANLI TAŞIMA HİZMETLERİ')) addFailure(failures, label, 'Görsel üstü açıklama yanlış.');
      if (!state.title.includes('Canpolat Nakliyat') || !state.title.includes('Güvenle Taşır, Güven Kazanır')) addFailure(failures, label, 'Hakkımızda başlığı yanlış.');

      const expectedInner = width <= 991 ? 1 : 2;
      const expectedBar = width <= 767 ? 2 : 4;
      const expectedServices = width <= 767 ? 1 : 2;
      if (state.innerColumns !== expectedInner) addFailure(failures, label, `Ana grid ${state.innerColumns}, beklenen ${expectedInner}.`);
      if (state.barColumns !== expectedBar) addFailure(failures, label, `Alt ikon grid ${state.barColumns}, beklenen ${expectedBar}.`);
      if (state.serviceColumns !== expectedServices) addFailure(failures, label, `Hizmet grid ${state.serviceColumns}, beklenen ${expectedServices}.`);
      if (state.visualHeight < 240) addFailure(failures, label, 'Görsel panel çok kısa.');
      if (JSON.stringify(state.visualItems) !== JSON.stringify(visualItemsExpected)) addFailure(failures, label, 'Görsel altı içerikler değişmiş.');
      if (JSON.stringify(state.serviceItems) !== JSON.stringify(serviceItemsExpected)) addFailure(failures, label, 'Paragraf altı içerikler değişmiş.');
      if (state.visualItems.some((item) => state.serviceItems.includes(item))) addFailure(failures, label, 'İki ikon grubu farklı değil.');
      for (const forbidden of forbiddenCopy) if (state.sectionText.includes(forbidden)) addFailure(failures, label, `Doğrulanmamış metin kaldı: ${forbidden}`);
      if (requestedPaths.includes('/assets/images/about-canpolat.webp') || requestedPaths.includes('/assets/images/about-canpolat-approved.webp') || requestedPaths.includes('/assets/images/about-canpolat-approved.svg')) addFailure(failures, label, 'Eski Hakkımızda görsel yolu hâlâ isteniyor.');

      const axe = await runAxe(page);
      if (axe.missing) addFailure(failures, label, 'Axe çalıştırılamadı.');
      if (axe.violations.length) addFailure(failures, label, `Axe serious/critical: ${axe.violations.map((v) => `${v.id}(${v.impact})`).join(', ')}`);

      let reducedMotion = null;
      if (width === 390 && height === 844) {
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        reducedMotion = await page.evaluate(() => {
          const brand = document.querySelector('.about-v2__brand-overlay');
          const pin = document.querySelector('.about-v2__pin-wrap');
          const service = document.querySelector('.about-v2__service');
          const pulse = document.querySelector('.about-v2__pin-pulse');
          return {
            matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
            brandTransition: brand ? getComputedStyle(brand).transitionDuration : null,
            pinTransition: pin ? getComputedStyle(pin).transitionDuration : null,
            serviceTransition: service ? getComputedStyle(service).transitionDuration : null,
            pulseDisplay: pulse ? getComputedStyle(pulse).display : null,
          };
        });
        if (!reducedMotion.matches || reducedMotion.brandTransition !== '0s' || reducedMotion.pinTransition !== '0s' || reducedMotion.serviceTransition !== '0s' || reducedMotion.pulseDisplay !== 'none') addFailure(failures, label, 'Reduced-motion kuralları başarısız.');
      }

      if (consoleErrors.length) addFailure(failures, label, `Console error: ${consoleErrors.join(' | ')}`);
      if (pageErrors.length) addFailure(failures, label, `Page error: ${pageErrors.join(' | ')}`);
      if (failedRequests.length) addFailure(failures, label, `Request failed: ${failedRequests.join(' | ')}`);
      if (httpErrors.length) addFailure(failures, label, `HTTP error: ${httpErrors.join(' | ')}`);

      await page.evaluate(() => { const h = document.querySelector('#site-header'); if (h) h.style.visibility = 'hidden'; });
      const handle = await page.$('#hakkimizda');
      const screenshot = path.join(outputDir, `section-03-${label}.png`);
      if (handle) await handle.screenshot({ path: screenshot }); else addFailure(failures, label, 'Screenshot section bulunamadı.');
      results.push({ label, screenshot: path.basename(screenshot), state, approvedResponse, axe, reducedMotion, consoleErrors, pageErrors, failedRequests, httpErrors });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify({ baseUrl, approvedImagePath, results, failures }, null, 2));
  if (failures.length) {
    console.error('BÖLÜM 03 BROWSER QA FAIL');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }
  console.log('BÖLÜM 03 BROWSER QA PASS');
  console.log('- 9 viewport doğrulandı');
  console.log('- Hash-kilitli endpoint 900x675 WebP olarak yüklendi ve piksel içeriği doğrulandı');
  console.log('- Gerçek logo/açıklama + CSS Edremit/Balıkesir pini doğrulandı');
  console.log('- İki farklı ikon grubu, 0 yatay taşma, Axe ve reduced-motion başarılı');
  console.log('- Bölüm 03 kaynaklı console/page/network hatası: 0');
})();