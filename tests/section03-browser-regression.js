const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const baseUrl = process.env.SECTION03_BASE_URL || 'http://127.0.0.1:8099/';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve(process.env.SECTION03_ARTIFACT_DIR || 'artifacts/section-03');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const viewports = [[320,568],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1366,768],[1440,900],[1920,1080]];
const visualExpected = ['Yerel Deneyim','Planlı Organizasyon','Özenli Paketleme','Doğrudan İletişim'];
const serviceExpected = ['Evden Eve Nakliyat','Şehirler Arası Taşıma','Asansörlü Taşıma','Ofis ve İşyeri Taşıma'];

fs.mkdirSync(outputDir, { recursive: true });
const fail = (items, label, text) => items.push(`${label}: ${text}`);

(async () => {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--force-device-scale-factor=1'] });
  const failures = [];
  const results = [];
  try {
    for (const [width,height] of viewports) {
      const label = `${width}x${height}`;
      const page = await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width <= 767, hasTouch: width <= 991 });
      const consoleErrors = [], pageErrors = [], failedRequests = [], httpErrors = [];
      let approvedResponse = null;
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', (e) => pageErrors.push(e.message));
      page.on('requestfailed', (r) => failedRequests.push(`${r.url()} :: ${r.failure()?.errorText || 'unknown'}`));
      page.on('response', (r) => {
        let pathname = r.url(); try { pathname = new URL(r.url()).pathname; } catch (_) {}
        if (pathname === '/assets/images/about-canpolat-approved.php') approvedResponse = { status: r.status(), contentType: (r.headers()['content-type'] || '').toLowerCase() };
        if (r.status() >= 400) httpErrors.push(`${r.status()} ${pathname}`);
      });

      const response = await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 45000 });
      if (!response || !response.ok()) fail(failures,label,`Ana sayfa HTTP ${response ? response.status() : 'yok'}`);
      await page.evaluate(() => document.querySelector('#hakkimizda')?.scrollIntoView({ block: 'center' }));
      await page.waitForFunction(() => {
        const s = document.querySelector('#hakkimizda.about-v2');
        const i = s?.querySelector('.about-v2__approved-image');
        const l = s?.querySelector('.about-v2__logo');
        return !!s && !!i && i.complete && i.naturalWidth > 0 && !!l && l.complete && l.naturalWidth > 0;
      }, { timeout: 15000 });
      await page.waitForFunction(() => document.querySelector('#hakkimizda.about-v2')?.classList.contains('is-visible'), { timeout: 10000 });
      await new Promise((r) => setTimeout(r, 1000));
      await page.addScriptTag({ content: axeSource });

      const state = await page.evaluate(() => {
        const s = document.querySelector('#hakkimizda');
        const inner = s?.querySelector('.about-v2__inner');
        const visual = s?.querySelector('.about-v2__visual');
        const scene = s?.querySelector('.about-v2__scene');
        const image = s?.querySelector('.about-v2__approved-image');
        const logo = s?.querySelector('.about-v2__logo');
        const brand = s?.querySelector('.about-v2__brand-overlay');
        const pin = s?.querySelector('.about-v2__pin-wrap');
        const bar = s?.querySelector('.about-v2__visual-bar');
        const services = s?.querySelector('.about-v2__services');
        const sceneRect = scene?.getBoundingClientRect();
        const pinRect = pin?.getBoundingClientRect();
        const imageRect = image?.getBoundingClientRect();
        let pixels = { nonWhite:0, dark:0, orange:0 };
        if (image?.complete && image.naturalWidth > 0) {
          const canvas = document.createElement('canvas'); canvas.width=180; canvas.height=135;
          const ctx = canvas.getContext('2d',{willReadFrequently:true}); ctx.drawImage(image,0,0,180,135);
          const data = ctx.getImageData(0,0,180,135).data; let nw=0,d=0,o=0;
          for (let i=0;i<data.length;i+=4) { const r=data[i],g=data[i+1],b=data[i+2]; if(r<235||g<235||b<235)nw++; if((r+g+b)/3<180)d++; if(r>180&&g>65&&g<190&&b<150&&r-g>35)o++; }
          const total=180*135; pixels={nonWhite:nw/total,dark:d/total,orange:o/total};
        }
        return {
          viewportWidth: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          className: s?.className || '',
          imageSrc: image ? new URL(image.src).pathname : '',
          naturalWidth: image?.naturalWidth || 0,
          naturalHeight: image?.naturalHeight || 0,
          attrWidth: image?.getAttribute('width') || '',
          attrHeight: image?.getAttribute('height') || '',
          imageFit: image ? getComputedStyle(image).objectFit : '',
          imageRatio: imageRect ? imageRect.width/imageRect.height : 0,
          pixels,
          logoSrc: logo ? new URL(logo.src).pathname : '',
          logoLoaded: !!(logo?.complete && logo.naturalWidth>0),
          brandOpacity: brand ? parseFloat(getComputedStyle(brand).opacity) : -1,
          pinOpacity: pin ? parseFloat(getComputedStyle(pin).opacity) : -1,
          pinX: sceneRect&&pinRect ? (pinRect.left+pinRect.width/2-sceneRect.left)/sceneRect.width : -1,
          pinY: sceneRect&&pinRect ? (pinRect.top+pinRect.height/2-sceneRect.top)/sceneRect.height : -1,
          pinLabel: pin?.innerText.trim() || '',
          visualItems: [...(s?.querySelectorAll('.about-v2__visual-item strong')||[])].map(e=>e.textContent.trim()),
          serviceItems: [...(s?.querySelectorAll('.about-v2__service strong')||[])].map(e=>e.textContent.trim()),
          columns: inner ? getComputedStyle(inner).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          barColumns: bar ? getComputedStyle(bar).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          serviceColumns: services ? getComputedStyle(services).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          visualHeight: visual?.getBoundingClientRect().height || 0,
          text: s?.innerText || '',
        };
      });

      if (!state.className.includes('about-v2') || !state.className.includes('is-visible')) fail(failures,label,'Bölüm 03 reveal durumu oluşmadı.');
      if (state.scrollWidth > state.viewportWidth + 1) fail(failures,label,`Yatay taşma var (${state.scrollWidth}>${state.viewportWidth}).`);
      if (!approvedResponse || approvedResponse.status !== 200 || !approvedResponse.contentType.includes('image/webp')) fail(failures,label,`WebP endpoint yanıtı geçersiz: ${JSON.stringify(approvedResponse)}`);
      if (state.imageSrc !== '/assets/images/about-canpolat-approved.php') fail(failures,label,`Onaylı endpoint kullanılmıyor: ${state.imageSrc}`);
      if (state.naturalWidth !== 900 || state.naturalHeight !== 675) fail(failures,label,`WebP decode ölçüsü ${state.naturalWidth}x${state.naturalHeight}.`);
      if (state.attrWidth !== '900' || state.attrHeight !== '675' || state.imageFit !== 'contain' || Math.abs(state.imageRatio-4/3)>.03) fail(failures,label,'Görsel 900x675 / 4:3 contain değil.');
      if (state.pixels.nonWhite < .20 || state.pixels.dark < .05 || state.pixels.orange < .003) fail(failures,label,`Görsel piksel içeriği başarısız: ${JSON.stringify(state.pixels)}`);
      if (!state.logoLoaded || state.logoSrc !== '/assets/images/canpolat-logo.svg') fail(failures,label,'Gerçek logo overlay yüklenmedi.');
      if (state.brandOpacity < .99 || state.pinOpacity < .99) fail(failures,label,`Overlay reveal tamamlanmadı (${state.brandOpacity}/${state.pinOpacity}).`);
      if (!state.pinLabel.includes('Edremit') || !state.pinLabel.includes('Balıkesir') || state.pinX<.40 || state.pinX>.56 || state.pinY<.18 || state.pinY>.40) fail(failures,label,`Pin konumu/etiketi yanlış (${state.pinX},${state.pinY},${state.pinLabel}).`);
      if (JSON.stringify(state.visualItems)!==JSON.stringify(visualExpected) || JSON.stringify(state.serviceItems)!==JSON.stringify(serviceExpected)) fail(failures,label,'İki ikon grubu baseline ile eşleşmiyor.');
      const expectedColumns = width <= 991 ? 1 : 2;
      const expectedBar = width <= 767 ? 2 : 4;
      const expectedServices = width <= 767 ? 1 : 2;
      if (state.columns!==expectedColumns || state.barColumns!==expectedBar || state.serviceColumns!==expectedServices) fail(failures,label,`Responsive grid yanlış (${state.columns}/${state.barColumns}/${state.serviceColumns}).`);
      if (state.visualHeight < 240) fail(failures,label,'Hakkımızda görsel paneli çok kısa.');
      for (const forbidden of ['Sigortalı Taşıma','Zamanında Teslimat','7/24 Destek','yılların deneyimi']) if (state.text.includes(forbidden)) fail(failures,label,`Doğrulanmamış metin kaldı: ${forbidden}`);

      const axe = await page.evaluate(async () => {
        const audit = await window.axe.run(document.querySelector('#hakkimizda'), { runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}, resultTypes:['violations'] });
        return audit.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>({id:v.id,impact:v.impact}));
      });
      if (axe.length) fail(failures,label,`Axe serious/critical: ${JSON.stringify(axe)}`);

      let reducedMotion = null;
      if (width===390 && height===844) {
        const rp = await browser.newPage(); await rp.setViewport({width,height,deviceScaleFactor:1,isMobile:true,hasTouch:true});
        await rp.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
        await rp.goto(baseUrl,{waitUntil:'networkidle0',timeout:45000}); await rp.evaluate(()=>document.querySelector('#hakkimizda')?.scrollIntoView({block:'center'})); await new Promise(r=>setTimeout(r,150));
        reducedMotion = await rp.evaluate(()=>{ const b=document.querySelector('.about-v2__brand-overlay'),p=document.querySelector('.about-v2__pin-wrap'),s=document.querySelector('.about-v2__service'),pulse=document.querySelector('.about-v2__pin-pulse'); return {matches:matchMedia('(prefers-reduced-motion: reduce)').matches,b:b?getComputedStyle(b).transitionDuration:null,p:p?getComputedStyle(p).transitionDuration:null,s:s?getComputedStyle(s).transitionDuration:null,pulse:pulse?getComputedStyle(pulse).display:null}; });
        if (!reducedMotion.matches || reducedMotion.b!=='0s' || reducedMotion.p!=='0s' || reducedMotion.s!=='0s' || reducedMotion.pulse!=='none') fail(failures,label,`Reduced-motion başarısız: ${JSON.stringify(reducedMotion)}`);
        await rp.close();
      }

      if (consoleErrors.length) fail(failures,label,`Console error: ${consoleErrors.join(' | ')}`);
      if (pageErrors.length) fail(failures,label,`Page error: ${pageErrors.join(' | ')}`);
      if (failedRequests.length) fail(failures,label,`Request failed: ${failedRequests.join(' | ')}`);
      if (httpErrors.length) fail(failures,label,`HTTP error: ${httpErrors.join(' | ')}`);

      await page.evaluate(()=>{const h=document.querySelector('#site-header');if(h)h.style.visibility='hidden';});
      const handle = await page.$('#hakkimizda');
      const screenshot = path.join(outputDir,`section-03-${label}.png`);
      if (handle) await handle.screenshot({path:screenshot}); else fail(failures,label,'Screenshot hedefi bulunamadı.');
      results.push({label,screenshot:path.basename(screenshot),state,approvedResponse,axe,reducedMotion,consoleErrors,pageErrors,failedRequests,httpErrors});
      await page.close();
    }
  } finally { await browser.close(); }

  fs.writeFileSync(path.join(outputDir,'report.json'),JSON.stringify({baseUrl,results,failures},null,2));
  if (failures.length) { console.error('BÖLÜM 03 BROWSER REGRESSION FAIL'); failures.forEach(x=>console.error(`- ${x}`)); process.exit(1); }
  console.log('BÖLÜM 03 BROWSER REGRESSION PASS');
  console.log('- 9 viewport, 900x675 WebP endpoint ve piksel içeriği doğrulandı');
  console.log('- Logo/pin, iki ikon grubu, Axe, reduced-motion ve network kontrolleri başarılı');
})();
