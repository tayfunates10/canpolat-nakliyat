const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const baseUrl = process.env.SECTION00_BASE_URL || 'http://127.0.0.1:8099/';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve(process.env.SECTION00_ARTIFACT_DIR || 'artifacts/section-00');
const viewports = [
  [1024, 768],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];

fs.mkdirSync(outputDir, { recursive: true });

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
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });

      await page.waitForFunction(() => {
        const hero = document.querySelector('.hero-r8');
        const layers = [...document.querySelectorAll('.hero-r8__layer')];
        if (!hero || layers.length !== 13 || !hero.classList.contains('is-ready')) return false;
        return layers.every((layer) => {
          const style = getComputedStyle(layer);
          return layer.classList.contains('is-loaded') && Number.parseFloat(style.opacity) >= 0.99;
        });
      }, { timeout: 8000 });

      // En geç başlayan R8 transition'ının da final transformuna oturmasını bekle.
      await new Promise((resolve) => setTimeout(resolve, 550));

      const state = await page.evaluate(() => {
        const hero = document.querySelector('.hero-r8');
        const canvas = document.querySelector('.hero-r8__canvas');
        const media = document.querySelector('.hero__media');
        const layers = [...document.querySelectorAll('.hero-r8__layer')];
        const rect = (el) => el ? el.getBoundingClientRect().toJSON() : null;
        const layerStates = layers.map((layer) => {
          const style = getComputedStyle(layer);
          return {
            className: layer.className,
            loaded: layer.classList.contains('is-loaded'),
            opacity: Number.parseFloat(style.opacity),
            transform: style.transform,
            display: style.display,
            rect: rect(layer),
          };
        });

        return {
          viewportWidth: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          heroReady: !!hero?.classList.contains('is-ready'),
          layerCount: layers.length,
          loadedCount: layerStates.filter((item) => item.loaded).length,
          visibleCount: layerStates.filter((item) => item.display !== 'none' && item.opacity >= 0.99).length,
          mediaRect: rect(media),
          heroRect: rect(hero),
          canvasRect: rect(canvas),
          mediaOverflow: media ? getComputedStyle(media).overflow : null,
          heroOverflow: hero ? getComputedStyle(hero).overflow : null,
          canvasOverflow: canvas ? getComputedStyle(canvas).overflow : null,
          layers: layerStates,
        };
      });

      if (!state.heroReady) failures.push(`${label}: hero is-ready değil.`);
      if (state.layerCount !== 13) failures.push(`${label}: R8 katman sayısı ${state.layerCount}, beklenen 13.`);
      if (state.loadedCount !== 13) failures.push(`${label}: yüklenen R8 katmanı ${state.loadedCount}/13.`);
      if (state.visibleCount !== 13) failures.push(`${label}: final durumda görünür R8 katmanı ${state.visibleCount}/13.`);
      if (state.scrollWidth > state.viewportWidth + 1) failures.push(`${label}: yatay taşma var (${state.scrollWidth} > ${state.viewportWidth}).`);

      const screenshot = path.join(outputDir, `hero-r8-final-${label}.png`);
      await page.screenshot({ path: screenshot, fullPage: false });
      results.push({ label, screenshot: path.basename(screenshot), state });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(outputDir, 'hero-r8-final-report.json'),
    JSON.stringify({ baseUrl, results, failures }, null, 2),
  );

  if (failures.length) {
    console.error('HERO R8 DESKTOP FINAL QA FAIL');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('HERO R8 DESKTOP FINAL QA PASS');
  console.log('- 1024 / 1366 / 1440 / 1920 final-state görüntüleri üretildi');
  console.log('- Her viewportta 13/13 katman yüklü ve opacity=1');
  console.log('- Yatay taşma: 0');
})();
