const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const baseUrl = process.env.SECTION05_BASE_URL || 'http://127.0.0.1:8099/';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve(process.env.SECTION05_ARTIFACT_DIR || 'artifacts/section-05');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const viewports = [
  [320, 568], [360, 800], [390, 844], [430, 932], [768, 1024],
  [1024, 768], [1366, 768], [1440, 900], [1920, 1080],
];

const expectedTitles = [
  'Edremit Odaklı Planlama',
  'Net Hizmet Kapsamı',
  'Eşyaya Göre Hazırlık',
  'Doğrudan İletişim',
];
const expectedTags = ['Yerel planlama', 'Açık kapsam', 'Uygun hazırlık', 'Kolay ulaşım'];
const forbiddenCopy = [
  '20 yıllık', '20 Yıllık', '%100', 'garantili', 'Garantili', 'Sigortalı', 'sigortalı',
  'en hızlı', 'En Hızlı', 'müşteri memnuniyeti', 'Müşteri Memnuniyeti',
];

fs.mkdirSync(outputDir, { recursive: true });
const failures = [];
const results = [];
const fail = (label, message) => failures.push(`${label}: ${message}`);

async function runAxe(page) {
  return page.evaluate(async () => {
    const target = document.querySelector('#neden-biz');
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
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
  });

  try {
    for (const [width, height] of viewports) {
      const label = `${width}x${height}`;
      const page = await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width <= 767, hasTouch: width <= 991 });

      const consoleErrors = [];
      const pageErrors = [];
      const requestFailures = [];
      const httpErrors = [];

      page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('requestfailed', (request) => requestFailures.push(`${request.url()} :: ${request.failure()?.errorText || 'unknown'}`));
      page.on('response', (response) => {
        if (response.status() >= 400) {
          let target = response.url();
          try { target = new URL(response.url()).pathname; } catch (_) {}
          httpErrors.push(`${response.status()} ${target}`);
        }
      });

      const response = await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });
      if (!response || !response.ok()) fail(label, `Ana sayfa HTTP ${response ? response.status() : 'yok'}`);

      const sectionHandle = await page.$('#neden-biz.why-us-v2');
      if (!sectionHandle) {
        fail(label, 'Bölüm 05 DOM içinde bulunamadı.');
        await page.close();
        continue;
      }

      await page.evaluate(() => document.querySelector('#neden-biz')?.scrollIntoView({ block: 'center' }));
      await page.waitForFunction(() => document.querySelector('#neden-biz.why-us-v2')?.classList.contains('is-visible'), { timeout: 10000 });
      await new Promise((resolve) => setTimeout(resolve, 800));
      await page.addScriptTag({ content: axeSource });

      const state = await page.evaluate(() => {
        const section = document.querySelector('#neden-biz');
        const layout = section?.querySelector('.why-us-v2__layout');
        const grid = section?.querySelector('.why-us-v2__grid');
        const cards = [...(section?.querySelectorAll('.why-us-v2__card') || [])];
        const icons = [...(section?.querySelectorAll('.why-us-v2__icon svg') || [])];
        const paths = [...(section?.querySelectorAll('.why-us-v2__icon svg path') || [])];
        const phone = section?.querySelector('.why-us-v2__phone');
        const whatsapp = section?.querySelector('.why-us-v2__whatsapp');
        const process = document.querySelector('#tasima-sureci');
        const faq = document.querySelector('#sss');
        const phoneRect = phone?.getBoundingClientRect();
        const whatsappRect = whatsapp?.getBoundingClientRect();

        return {
          viewportWidth: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          sectionClass: section?.className || '',
          sectionText: section?.innerText || '',
          title: section?.querySelector('#why-us-v2-title')?.innerText.trim() || '',
          cardCount: cards.length,
          titles: cards.map((card) => card.querySelector('h3')?.textContent.trim() || ''),
          tags: cards.map((card) => card.querySelector('.why-us-v2__tag')?.textContent.trim() || ''),
          iconCount: icons.length,
          iconFills: paths.map((path) => path.getAttribute('fill') || ''),
          iconStrokes: paths.map((path) => path.getAttribute('stroke') || ''),
          layoutColumns: layout ? getComputedStyle(layout).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          gridColumns: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          phoneHref: phone?.getAttribute('href') || '',
          whatsappHref: whatsapp?.getAttribute('href') || '',
          whatsappTarget: whatsapp?.getAttribute('target') || '',
          whatsappRel: whatsapp?.getAttribute('rel') || '',
          phoneHeight: phoneRect?.height || 0,
          whatsappHeight: whatsappRect?.height || 0,
          manifesto: section?.querySelector('.why-us-v2__manifesto')?.innerText.trim() || '',
          processBeforeWhy: !!(process && section && (process.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING)),
          whyBeforeFaq: !!(section && faq && (section.compareDocumentPosition(faq) & Node.DOCUMENT_POSITION_FOLLOWING)),
          cardsVisible: cards.every((card) => {
            const style = getComputedStyle(card);
            const rect = card.getBoundingClientRect();
            return parseFloat(style.opacity) > 0.99 && rect.width > 100 && rect.height > 100;
          }),
        };
      });

      if (!state.sectionClass.includes('why-us-v2') || !state.sectionClass.includes('is-visible')) fail(label, 'Bölüm 05 reveal durumu oluşmadı.');
      if (state.scrollWidth > state.viewportWidth + 1) fail(label, `Yatay taşma var (${state.scrollWidth} > ${state.viewportWidth}).`);
      if (!state.title.includes('Taşınma Sürecinde') || !state.title.includes('Net Bir Yaklaşım')) fail(label, `Başlık yanlış: ${state.title}`);
      if (state.cardCount !== 4) fail(label, `Kart sayısı ${state.cardCount}, beklenen 4.`);
      if (JSON.stringify(state.titles) !== JSON.stringify(expectedTitles)) fail(label, `Kart başlıkları değişmiş: ${JSON.stringify(state.titles)}`);
      if (JSON.stringify(state.tags) !== JSON.stringify(expectedTags)) fail(label, `Kart alt etiketleri değişmiş: ${JSON.stringify(state.tags)}`);
      if (state.iconCount !== 4 || state.iconFills.some((value) => value !== 'currentColor') || state.iconStrokes.some(Boolean)) fail(label, 'Dört ana ikon dolu/simetrik fill SVG yapısında değil.');
      if (!state.cardsVisible) fail(label, 'Kartlardan en az biri görünür/render edilmiş değil.');
      if (!state.manifesto.includes('4 TEMEL NOKTA') || !state.manifesto.includes('Planlama') || !state.manifesto.includes('Kapsam') || !state.manifesto.includes('Hazırlık') || !state.manifesto.includes('İletişim')) fail(label, '4 Temel Nokta paneli eksik/değişmiş.');

      const expectedLayoutColumns = width <= 991 ? 1 : 2;
      const expectedGridColumns = width <= 767 ? 1 : 2;
      if (state.layoutColumns !== expectedLayoutColumns) fail(label, `Ana layout sütunu ${state.layoutColumns}, beklenen ${expectedLayoutColumns}.`);
      if (state.gridColumns !== expectedGridColumns) fail(label, `Kart grid sütunu ${state.gridColumns}, beklenen ${expectedGridColumns}.`);
      if (!state.processBeforeWhy || !state.whyBeforeFaq) fail(label, 'Bölüm 05 Taşıma Süreci ile SSS arasına yerleşmemiş.');

      if (state.phoneHref !== 'tel:+905359120691') fail(label, `Telefon href yanlış: ${state.phoneHref}`);
      if (state.whatsappHref !== 'https://wa.me/905359120691') fail(label, `WhatsApp href yanlış: ${state.whatsappHref}`);
      if (state.whatsappTarget !== '_blank' || !state.whatsappRel.split(/\s+/).includes('noopener')) fail(label, 'WhatsApp dış bağlantı güvenliği eksik.');
      if (state.phoneHeight < 44 || state.whatsappHeight < 44) fail(label, `Dokunma hedefi küçük (${state.phoneHeight}/${state.whatsappHeight}).`);
      for (const forbidden of forbiddenCopy) if (state.sectionText.includes(forbidden)) fail(label, `Doğrulanmamış ifade bulundu: ${forbidden}`);

      const axe = await runAxe(page);
      if (axe.missing) fail(label, 'Axe çalıştırılamadı.');
      if (axe.violations.length) fail(label, `Axe serious/critical: ${axe.violations.map((v) => `${v.id}(${v.impact})`).join(', ')}`);

      if (consoleErrors.length) fail(label, `Console error: ${consoleErrors.join(' | ')}`);
      if (pageErrors.length) fail(label, `Page error: ${pageErrors.join(' | ')}`);
      if (requestFailures.length) fail(label, `Request failure: ${requestFailures.join(' | ')}`);
      if (httpErrors.length) fail(label, `HTTP error: ${httpErrors.join(' | ')}`);

      await page.addStyleTag({ content: '.site-header{visibility:hidden!important}.whatsapp-float,.back-to-top{display:none!important}' });
      const freshSectionHandle = await page.$('#neden-biz');
      await freshSectionHandle.screenshot({ path: path.join(outputDir, `section-05-${label}.png`) });

      results.push({ label, state, axe, consoleErrors, pageErrors, requestFailures, httpErrors });
      await page.close();
    }

    const reducedPage = await browser.newPage();
    await reducedPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await reducedPage.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await reducedPage.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });
    await reducedPage.evaluate(() => document.querySelector('#neden-biz')?.scrollIntoView({ block: 'center' }));
    await new Promise((resolve) => setTimeout(resolve, 250));
    const reduced = await reducedPage.evaluate(() => {
      const section = document.querySelector('#neden-biz');
      const intro = section?.querySelector('.why-us-v2__intro');
      const card = section?.querySelector('.why-us-v2__card');
      return {
        matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        visible: section?.classList.contains('is-visible') || false,
        motionReady: section?.classList.contains('why-us-motion-ready') || false,
        introTransition: intro ? getComputedStyle(intro).transitionDuration : null,
        cardTransition: card ? getComputedStyle(card).transitionDuration : null,
        cardOpacity: card ? parseFloat(getComputedStyle(card).opacity) : -1,
        cardTransform: card ? getComputedStyle(card).transform : null,
      };
    });
    if (!reduced.matches || !reduced.visible || reduced.motionReady || reduced.introTransition !== '0s' || reduced.cardTransition !== '0s' || reduced.cardOpacity < 0.99 || (reduced.cardTransform !== 'none' && reduced.cardTransform !== 'matrix(1, 0, 0, 1, 0, 0)')) {
      fail('390x844 reduced-motion', `Reduced-motion başarısız: ${JSON.stringify(reduced)}`);
    }
    await reducedPage.close();

    const report = { failures, results, reducedMotion: reduced };
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));

    if (failures.length) {
      console.error('BÖLÜM 05 BROWSER QA FAIL');
      failures.forEach((message) => console.error(`- ${message}`));
      process.exit(1);
    }

    console.log('BÖLÜM 05 BROWSER QA PASS');
    console.log(`- ${viewports.length} viewport doğrulandı`);
    console.log('- Masaüstü 2x2 kart, tablet 2x2 ve mobil tek sütun düzeni doğrulandı');
    console.log('- Dolu SVG ikonlar, iki iletişim CTA’sı ve section sırası doğrulandı');
    console.log('- Yatay taşma 0, Axe serious/critical 0, console/page/network hata 0');
    console.log('- prefers-reduced-motion doğrulandı');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
