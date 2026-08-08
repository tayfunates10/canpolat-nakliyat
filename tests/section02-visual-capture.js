const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const baseUrl = process.env.SECTION02_BASE_URL || 'http://127.0.0.1:8099/';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve(process.env.SECTION02_VISUAL_DIR || 'artifacts/section-02-clean');

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

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
  });

  try {
    for (const [width, height] of viewports) {
      const page = await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width <= 767, hasTouch: width <= 991 });
      await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });

      await page.evaluate(() => document.querySelector('#hizmetler')?.scrollIntoView({ block: 'start' }));
      await page.waitForFunction(() => {
        const images = [...document.querySelectorAll('#hizmetler .service-card__media img')];
        return images.length === 5 && images.every((img) => img.complete && img.naturalWidth > 0);
      }, { timeout: 10000 });

      /*
       * Bu script yalnız bölüm-onay artifact'i üretir. Sticky header'ın
       * ElementHandle.screenshot sırasında bölüm üzerine yeniden bindirilmesini
       * önlemek için sadece capture anında görünürlüğünü kapatır. Gerçek sayfa
       * CSS'i ve browser QA ölçümleri değiştirilmez.
       */
      await page.evaluate(() => {
        const header = document.querySelector('.site-header');
        if (header) header.style.visibility = 'hidden';
      });

      const section = await page.$('#hizmetler');
      if (!section) throw new Error('#hizmetler bulunamadı.');
      await section.screenshot({ path: path.join(outputDir, `section-02-clean-${width}x${height}.png`) });

      await page.evaluate(() => {
        const header = document.querySelector('.site-header');
        if (header) header.style.visibility = '';
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log('BÖLÜM 02 CLEAN VISUAL CAPTURE PASS');
  console.log('- 9 section-only artifact üretildi');
  console.log('- Sticky header yalnız screenshot anında gizlendi; gerçek QA/CSS değişmedi');
})();
