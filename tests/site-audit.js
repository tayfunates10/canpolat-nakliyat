const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const failures = [];

function read(relative) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    failures.push(`Eksik dosya: ${relative}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

function requireToken(relative, source, token, message) {
  if (!source.includes(token)) failures.push(`${relative}: ${message}`);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function validateSchemaUrls(value, relative, trail = 'schema') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateSchemaUrls(item, relative, `${trail}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (['url', 'item', 'image', 'logo', '@id'].includes(key) && typeof child === 'string' && child.startsWith('http')) {
      try {
        const url = new URL(child);
        if (!['www.canpolatnakliyat.com', 'schema.org'].includes(url.hostname)) failures.push(`${relative}: ${trail}.${key} beklenmeyen host kullanıyor: ${url.hostname}`);
        if (child.includes('comhizmetler')) failures.push(`${relative}: ${trail}.${key} hatalı URL: ${child}`);
      } catch (error) {
        failures.push(`${relative}: ${trail}.${key} geçersiz URL: ${child}`);
      }
    }
    validateSchemaUrls(child, relative, `${trail}.${key}`);
  }
}

const publicPages = [
  'index-template.html',
  'hakkimizda.html',
  'galeri.html',
  'gizlilik.html',
  'bolgeler/edremit-nakliyat.html',
  'hizmetler/evden-eve-nakliyat.html',
  'hizmetler/sehirler-arasi-nakliyat.html',
  'hizmetler/ofis-isyeri-tasima.html',
  'hizmetler/asansorlu-tasima.html',
  'hizmetler/paketleme-montaj.html',
];

const servicePages = publicPages.filter(page => page.startsWith('hizmetler/'));
const titleSet = new Set();

for (const relative of publicPages.concat(['404.html'])) {
  const source = read(relative);
  for (const token of [
    '<html lang="tr">',
    '<meta name="viewport"',
    '<meta name="description"',
    '<meta name="theme-color" content="#253349">',
    'id="ana-icerik"',
    'rel="icon" href="/assets/images/favicon-canpolat.svg"',
    'rel="manifest" href="/manifest.webmanifest"',
    'href="/css/style.css?v=20260810-01"',
    'href="tel:+905359120691"',
    'https://wa.me/905359120691',
    'Camivasat Mah. Akçay Cad. No: 78',
  ]) requireToken(relative, source, token, `zorunlu üretim öğesi eksik: ${token}`);

  const titleMatch = source.match(/<title>([^<]+)<\/title>/);
  if (!titleMatch) {
    failures.push(`${relative}: title eksik.`);
  } else if (titleSet.has(titleMatch[1])) {
    failures.push(`${relative}: title benzersiz değil: ${titleMatch[1]}`);
  } else {
    titleSet.add(titleMatch[1]);
    if (titleMatch[1].length < 25 || titleMatch[1].length > 65) failures.push(`${relative}: title uzunluğu 25-65 karakter aralığında olmalıdır.`);
  }

  const descriptionMatch = source.match(/<meta name="description" content="([^"]+)"/);
  if (!descriptionMatch || descriptionMatch[1].length < 110 || descriptionMatch[1].length > 165) failures.push(`${relative}: meta description uzunluğu 110-165 karakter aralığında olmalıdır.`);

  const h1Count = (source.match(/<h1(?:\s|>)/g) || []).length;
  if (h1Count !== 1) failures.push(`${relative}: tam bir H1 bulunmalı, bulunan ${h1Count}.`);

  if (source.includes('https://canpolatnakliyat.com')) failures.push(`${relative}: non-www origin kullanılmamalıdır.`);
  if (/https:\/\/(?:fonts\.googleapis|fonts\.gstatic|cdn\.)/i.test(source)) failures.push(`${relative}: üçüncü taraf font/CDN bağımlılığı bulunmamalıdır.`);
  if (source.includes('Altınkum Mah.') || source.includes('canpolat_r8_11_cache_reset')) failures.push(`${relative}: eski adres veya eski cache çerezi kalıntısı bulundu.`);

  for (const match of source.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(match[0])) failures.push(`${relative}: yeni sekme bağlantısında noopener eksik.`);
  }
  for (const match of source.matchAll(/<img\b[^>]*>/g)) {
    if (!/\bwidth="\d+"/.test(match[0]) || !/\bheight="\d+"/.test(match[0])) failures.push(`${relative}: görsel ölçüleri eksik: ${match[0].slice(0, 100)}`);
  }

  const localReferences = [...source.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)].map(match => match[1]);
  for (const reference of localReferences) {
    if (reference === '/') continue;
    const target = path.join(root, reference.replace(/^\//, ''));
    if (!fs.existsSync(target)) failures.push(`${relative}: kırık yerel bağlantı: ${reference}`);
  }

  for (const match of source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const schema = JSON.parse(match[1]);
      validateSchemaUrls(schema, relative);
    } catch (error) {
      failures.push(`${relative}: JSON-LD geçersiz: ${error.message}`);
    }
  }
}

for (const relative of publicPages) {
  const source = read(relative);
  const expectedCanonical = relative === 'index-template.html'
    ? 'https://www.canpolatnakliyat.com/'
    : `https://www.canpolatnakliyat.com/${relative}`;
  const canonicalCount = (source.match(/rel="canonical"/g) || []).length;
  if (canonicalCount !== 1) failures.push(`${relative}: tam bir canonical bulunmalı, bulunan ${canonicalCount}.`);
  requireToken(relative, source, `<link rel="canonical" href="${expectedCanonical}">`, 'canonical URL sayfa yoluyla eşleşmiyor.');
  requireToken(relative, source, '<meta name="robots" content="index, follow', 'index/follow robots yönergesi eksik.');
  requireToken(relative, source, '<meta property="og:url" content="https://www.canpolatnakliyat.com', 'Open Graph URL eksik.');
}

/*
 * Site yolu her iç sayfada aynı yerde durmalı: main açılır açılmaz, sayfa
 * kahramanından önce. Ana sayfada gösterilecek bir yol yok, o yüzden dışarıda.
 */
for (const relative of publicPages.concat(['404.html'])) {
  if (relative === 'index-template.html') {
    if (read(relative).includes('class="breadcrumb-bar"')) failures.push(`${relative}: ana sayfada site yolu bulunmamalıdır.`);
    continue;
  }
  const source = read(relative);
  if (!/<main id="ana-icerik"[^>]*>\n  <div class="breadcrumb-bar">\n    <nav class="breadcrumb container" aria-label="Sayfa yolu">/.test(source)) {
    failures.push(`${relative}: site yolu header'ın hemen altında, main'in ilk öğesi olmalıdır.`);
  }
  if (!/<span aria-current="page">[^<]+<\/span><\/nav>/.test(source)) failures.push(`${relative}: site yolunda bulunulan sayfa işaretlenmelidir.`);
}

const notFound = read('404.html');
requireToken('404.html', notFound, '<meta name="robots" content="noindex, follow">', '404 noindex olmalıdır.');
if (notFound.includes('rel="canonical"')) failures.push('404.html: 404 sayfasında canonical bulunmamalıdır.');

for (const relative of servicePages) {
  const source = read(relative);
  const canonical = `https://www.canpolatnakliyat.com/${relative}`;
  requireToken(relative, source, `<link rel="canonical" href="${canonical}">`, 'canonical URL dosya yoluyla eşleşmiyor.');
  requireToken(relative, source, `href="/${relative}" aria-current="page"`, 'yan hizmet menüsünde aktif sayfa durumu eksik.');
  requireToken(relative, source, '"@type": "Service"', 'Service JSON-LD eksik.');
  requireToken(relative, source, '"@type": "BreadcrumbList"', 'BreadcrumbList JSON-LD eksik.');
  requireToken(relative, source, '<nav class="breadcrumb container"', 'görünür sayfa yolu eksik.');
  if (source.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length < 350) failures.push(`${relative}: hizmet içeriği yetersiz.`);
  const related = source.match(/<div class="related-grid">([\s\S]*?)<\/div>/);
  if (!related) {
    failures.push(`${relative}: ilgili hizmetler alanı eksik.`);
  } else if (related[1].includes(`href="/${relative}"`)) {
    failures.push(`${relative}: ilgili hizmetler alanı mevcut sayfaya bağlanmamalıdır.`);
  }
}

const forbidden = ['Okur Nakliyat', 'okurnakliyatedremit.com', '0537 226 50 43', 'Altınkum Mah. 108. Sk. No: 5'];
const textFiles = publicPages.concat(['404.html', 'index.php', 'README.md', 'css/style.css', 'js/script.js']);
for (const relative of textFiles) {
  const source = read(relative);
  for (const token of forbidden) if (source.includes(token)) failures.push(`${relative}: eski bilgi kalıntısı: ${token}`);
}

const template = read('index-template.html');
const homeSchemaMatch = template.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (homeSchemaMatch) {
  const homeSchema = JSON.parse(homeSchemaMatch[1]);
  const faq = homeSchema['@graph'].find(item => item['@type'] === 'FAQPage');
  const visibleTemplate = template.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  if (!faq || !Array.isArray(faq.mainEntity) || faq.mainEntity.length !== 5) {
    failures.push('index-template.html: tam 5 FAQ JSON-LD kaydı bulunmalıdır.');
  } else {
    for (const question of faq.mainEntity) {
      if (!visibleTemplate.includes(question.name) || !visibleTemplate.includes(question.acceptedAnswer.text)) failures.push(`index-template.html: FAQ JSON-LD görünür içerikle eşleşmiyor: ${question.name}`);
    }
  }
}
const sectionOrder = ['id="anasayfa"', 'class="trust-bar"', 'id="hizmetler"', 'id="hakkimizda"', 'id="surec"', 'class="section why-us"', 'id="bolgeler"', 'id="sss"', 'id="teklif"', 'class="final-cta"'];
let previous = -1;
for (const token of sectionOrder) {
  const current = template.indexOf(token);
  if (current === -1) failures.push(`index-template.html: bölüm eksik: ${token}`);
  if (current !== -1 && current <= previous) failures.push(`index-template.html: bölüm sırası bozuk: ${token}`);
  if (current !== -1) previous = current;
}

for (const token of [
  'id="quote-request-form" action="/api/teklif.php" method="post"',
  'id="form-alert" role="alert"',
  'id="form-success" role="status"',
  'name="website"',
  '"@type": "MovingCompany"',
  '"@type": "FAQPage"',
  '"@type": "WebSite"',
  '"opens": "08:00", "closes": "20:00"',
]) requireToken('index-template.html', template, token, `ana sayfa zorunlu öğesi eksik: ${token}`);

const serviceLinks = [
  '/hizmetler/evden-eve-nakliyat.html',
  '/hizmetler/sehirler-arasi-nakliyat.html',
  '/hizmetler/ofis-isyeri-tasima.html',
  '/hizmetler/asansorlu-tasima.html',
  '/hizmetler/paketleme-montaj.html',
];
for (const link of serviceLinks) requireToken('index-template.html', template, `href="${link}"`, `hizmet bağlantısı eksik: ${link}`);

const serviceImages = [
  ['Evden Eve Nakliyat', 'service-evden-eve', '54c73ed6c0add793e0f82ead9b32db04e92b254688957722ee315f7dd4d045dd', '151895723f7505d687ea0062b6ce1e193d2ca45e5fbefe0102f5927da524174c'],
  ['Şehirler Arası Nakliyat', 'service-sehirler-arasi', '0de65f313098052d472bea9e4f3d8cf8e51c429fdcd8618eb9e02f0275afbb49', '3b0b02ee0b45c9a25f0f2d0062aa69ad717650d4d22d1ecb26e13901af83048c'],
  ['Ofis ve İş Yeri Taşıma', 'service-ofis', 'fae21c7511609bed32a0e8a307b170a8e3e2d89819130f2e94eab60c46429ec9', 'e3261117c35fcb26cbb1dd107947f03916b304371cf8d845466e363180d951af'],
  ['Asansörlü Taşıma', 'service-asansorlu', '610960059cd339620c0245f3105350aea16f1789cf59971903f32f8b837cae27', '53158238d807769f824f6ecdaaa06de8d418457b68128f13ff7e8cec74159af8'],
  ['Paketleme ve Montaj', 'service-paketleme', 'd522eee0b7978053646461ca03a2f26edb99150a7ccb2f4bc33e0513e8b3ec1b', 'fcfa4899e63f2a31fbaa91053ccf859b584dfbef1024873cf368ebe32e58c85c'],
];

for (const [label, basename, sourceHash, webpHash] of serviceImages) {
  const sourcePath = path.join(root, 'source-assets/services', `${basename}.png`);
  const webpPath = path.join(root, 'assets/images', `${basename}.webp`);
  if (!fs.existsSync(sourcePath)) {
    failures.push(`${label}: kaynak PNG eksik.`);
  } else {
    const buffer = fs.readFileSync(sourcePath);
    if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || buffer.readUInt32BE(16) !== 1586 || buffer.readUInt32BE(20) !== 992) failures.push(`${label}: kaynak PNG biçim veya ölçüsü değişmiş.`);
    if (sha256(buffer) !== sourceHash) failures.push(`${label}: kaynak PNG kimliği değişmiş.`);
  }
  if (!fs.existsSync(webpPath)) {
    failures.push(`${label}: WebP eksik.`);
  } else {
    const buffer = fs.readFileSync(webpPath);
    if (buffer.subarray(0, 4).toString('ascii') !== 'RIFF' || buffer.subarray(8, 12).toString('ascii') !== 'WEBP') failures.push(`${label}: WebP biçimi geçersiz.`);
    if (sha256(buffer) !== webpHash) failures.push(`${label}: onaylı WebP kimliği değişmiş.`);
  }
  requireToken('index-template.html', template, `src="/assets/images/${basename}.webp"`, `${label} görseli ana sayfada eksik.`);
}

const heroLayers = [
  ['p00', 'platform-p00-r8-reference-exact.png', '6a2218996325d954fd17e938d5f105929489952f57753967dd98f04fabdec47b'],
  ['l09', 'layer-l09-r6.png', '7c087183945ba233220473ad349b79061ce50b6efb4b46f42e01f1ec7ef82111'],
  ['t00', 'truck-t00-r6.png', '2efda3aba4ddb2b07788612c3a4e2a94bdb9b9ce92e69bbd995f19844b38aef0'],
  ['l01', 'layer-l01-r6.png', 'e5e5885eae573f43f2b83360c2709e649b384442bb2c5b2533caa6e530cbd95e'],
  ['l02', 'layer-l02-r6.png', '3c57c46a32d842ecc7db07aa42ccb596b68b31b96febf3eb6f6d59061aa4fbca'],
  ['l04', 'layer-l04-r6.png', 'a1e0fb5922a77a46c6ca31eeff9389f8d14f4795ff3845979cbbfbfda409379c'],
  ['l03', 'layer-l03-r6.png', '4655bcaa7db698f6fb24f077158d3dedc17a5bb85979e53628f1e94c5da345d8'],
  ['l05', 'layer-l05-r6.png', 'a5b7f5fa0dfcd5496eee26bf92a3d9564f6396767a2b388634eb8a54de3b4ff0'],
  ['l06', 'layer-l06-r6.png', '70688757b277b63a008ce09a924c1808a38e6adc7859f8558e0f6700ee311875'],
  ['l10', 'layer-l10-r6.png', 'a94a419d89f1fb69eda499d59fa71e73416ffc922f513d0d03f6d530adf87541'],
  ['l11', 'layer-l11-r6.png', 'fba52d10cde807a49856c6e1b9e7f3489bd26f12d79c3b28b82c75e6a3a7db30'],
  ['l07', 'layer-l07-r6.png', 'b8a08d6dd1e033c381580865d388fdeffce7b91c1100ca7527c1d89aa89fd77c'],
  ['l08', 'layer-l08-r6.png', 'd5d6c239a42eb13c06f306e7ca5b3c47c32707de26e4c9a031d3c03eaa47d5fc'],
  ['l12', 'layer-l12-r6.png', '969a4cdd9ca6c0e461b7de28310d0f38c8c93875e195be1cc58b943e02ae6c83'],
];

previous = -1;
for (const [id, filename, expectedHash] of heroLayers) {
  const file = path.join(root, 'assets/images/hero-r8', filename);
  if (!fs.existsSync(file)) {
    failures.push(`Hero R8 ${id.toUpperCase()} eksik: ${filename}`);
    continue;
  }
  const buffer = fs.readFileSync(file);
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || buffer.readUInt32BE(16) !== 1536 || buffer.readUInt32BE(20) !== 1024 || buffer[25] !== 6) failures.push(`Hero R8 ${id.toUpperCase()}: PNG biçimi, ölçüsü veya RGBA yapısı değişmiş.`);
  if (sha256(buffer) !== expectedHash) failures.push(`Hero R8 ${id.toUpperCase()}: dosya kimliği değişmiş.`);
  const current = template.indexOf(`hero-r8__layer--${id}`);
  if (current === -1) failures.push(`index-template.html: Hero R8 katmanı eksik: ${id}`);
  if (current !== -1 && current <= previous) failures.push(`index-template.html: Hero R8 DOM sırası bozuk: ${id}`);
  if (current !== -1) previous = current;
}
if ((template.match(/hero-r8__layer--[a-z0-9]+/g) || []).length !== 14) failures.push('index-template.html: tam 14 Hero R8 katmanı bulunmalıdır.');

const indexPhp = read('index.php');
for (const token of ["__DIR__ . '/index-template.html'", "__DIR__ . '/404.html'", 'http_response_code(404)', "header('X-Robots-Tag: noindex, follow')", 'is_readable($templatePath)', 'readfile($templatePath)', "header('Content-Type: text/html; charset=UTF-8')"]) requireToken('index.php', indexPhp, token, `sade renderer/404 öğesi eksik: ${token}`);
for (const forbiddenToken of ['str_replace(', 'preg_replace(', 'X-LiteSpeed-Purge', 'Clear-Site-Data']) if (indexPhp.includes(forbiddenToken)) failures.push(`index.php: kırılgan runtime dönüşümü bulunmamalı: ${forbiddenToken}`);

const indexStub = read('index.html');
requireToken('index.html', indexStub, '<meta http-equiv="refresh" content="0; url=/">', 'güvenli kök yönlendirmesi eksik.');
if (indexStub.includes('hero-r8__layer')) failures.push('index.html: public stub Hero içermemelidir.');

const siteCss = read('css/style.css');
for (const token of ['.hero__inner', 'grid-template-columns: .82fr 1.18fr', '.service-grid', 'grid-template-columns: repeat(6, 1fr)', '.content-grid', '.mobile-contact-bar', '@media (max-width: 720px)']) requireToken('css/style.css', siteCss, token, `responsive tasarım kuralı eksik: ${token}`);

const heroCss = read('css/hero-animated.css');
const heroJs = read('js/hero-animated.js');
for (const token of ['object-fit: contain', '.hero-r8.is-loading .hero-r8__layer', '.hero-r8.is-ready .hero-r8__layer.is-loaded', '@media (prefers-reduced-motion: reduce)']) requireToken('css/hero-animated.css', heroCss, token, `Hero kuralı eksik: ${token}`);
for (const token of ["stage.classList.add('is-loading')", 'layers.length !== 14', "stage.classList.add('is-ready')"]) requireToken('js/hero-animated.js', heroJs, token, `Hero kontrolü eksik: ${token}`);
heroLayers.forEach(([id], index) => {
  const z = index + 1;
  if (!new RegExp(`\\.hero-r8__layer--${id}\\s*\\{\\s*z-index:\\s*${z};\\s*\\}`).test(heroCss)) failures.push(`css/hero-animated.css: ${id.toUpperCase()} z-index ${z} olmalıdır.`);
});

const htaccess = read('.htaccess');
for (const token of ['DirectoryIndex index.php', '!^www\\.canpolatnakliyat\\.com$', 'RewriteRule ^$ index.php [L]', 'RewriteCond %{REQUEST_FILENAME} !-f', 'RewriteCond %{REQUEST_FILENAME} !-d', 'Header always unset X-Okur-Htaccess', 'Content-Security-Policy', "script-src 'self'", 'Strict-Transport-Security']) requireToken('.htaccess', htaccess, token, `production kuralı eksik: ${token}`);

/*
 * Galeri. Kareler gerçek saha fotoğrafları; her biri markalı alt bandıyla
 * birlikte 4/3 üretilir. Denetim; kare sayısını, iki srcset genişliğinin de
 * diskte durduğunu ve arama motoru için anlamlı alt metni zorunlu tutar.
 */
const galleryPages = [['index-template.html', template, 6], ['galeri.html', read('galeri.html'), 16]];
const galleryNames = new Set();

for (const [relative, source, expected] of galleryPages) {
  const grid = source.match(/<div class="gallery__grid">([\s\S]*?)<\/div>/);
  if (!grid) {
    failures.push(`${relative}: galeri ızgarası bulunamadı.`);
    continue;
  }

  const images = [...grid[1].matchAll(/<img\b[^>]*>/g)].map(match => match[0]);
  if (images.length !== expected) failures.push(`${relative}: ${expected} galeri karesi bekleniyor, bulunan ${images.length}.`);

  for (const image of images) {
    const source1x = image.match(/src="\/assets\/images\/galeri\/([a-z0-9-]+)\.webp/);
    if (!source1x) {
      failures.push(`${relative}: galeri karesi /assets/images/galeri altından gelmelidir.`);
      continue;
    }
    galleryNames.add(source1x[1]);

    for (const suffix of ['', '-640']) {
      const file = path.join(root, 'assets/images/galeri', `${source1x[1]}${suffix}.webp`);
      if (!fs.existsSync(file)) failures.push(`${relative}: galeri görseli eksik: ${source1x[1]}${suffix}.webp`);
    }
    if (!image.includes(`/assets/images/galeri/${source1x[1]}-640.webp`)) failures.push(`${relative}: ${source1x[1]} için srcset dar genişliği eksik.`);
    if (!/\bsizes="/.test(image)) failures.push(`${relative}: ${source1x[1]} için sizes tanımı eksik.`);

    const alt = image.match(/alt="([^"]*)"/);
    if (!alt || alt[1].trim().length < 30) failures.push(`${relative}: galeri karesi açıklayıcı alt metin taşımalıdır: ${source1x[1]}`);
  }
}

if (galleryNames.size !== 16) failures.push(`galeri: 16 benzersiz kare bekleniyor, bulunan ${galleryNames.size}.`);

const deploy = read('scripts/prepare-deploy.sh');
for (const token of ['"index-template.html"', '"api"', '"css"', '"js"', '"hizmetler"', '"bolgeler"']) requireToken('scripts/prepare-deploy.sh', deploy, token, `yayın yolu eksik: ${token}`);
for (const name of galleryNames) requireToken('scripts/prepare-deploy.sh', deploy, `"${name}"`, `Galeri karesi yayın doğrulamasında eksik: ${name}`);
for (const [, filename] of heroLayers) requireToken('scripts/prepare-deploy.sh', deploy, `assets/images/hero-r8/${filename}`, `Hero dosyası yayın doğrulamasında eksik: ${filename}`);

if (failures.length) {
  console.error('Site denetimi başarısız:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PASS: 10 indekslenebilir sayfa, 5 hizmet içeriği, SEO/bağlantı yapısı, NAP, güvenlik, 5/5 hizmet görseli ve 14/14 kilitli Hero R8 katmanı doğrulandı.');
