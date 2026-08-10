const fs = require('fs');
const path = require('path');

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

const template = read('index-template.html');
const indexPhp = read('index.php');
const quoteJs = read('js/quote-form.js');
const quoteApi = read('api/teklif.php');
const mainJs = read('js/script.js');
const css = read('css/style.css');
const htaccess = read('.htaccess');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const privacy = read('gizlilik.html');
const notFound = read('404.html');
const deploy = read('scripts/prepare-deploy.sh');
const manifest = read('manifest.webmanifest');

for (const token of [
  '<link rel="canonical" href="https://www.canpolatnakliyat.com/">',
  '<title>Edremit Nakliyat | Evden Eve ve Şehirler Arası | Canpolat</title>',
  '<meta property="og:image" content="https://www.canpolatnakliyat.com/assets/images/service-evden-eve.webp">',
  '<link rel="preload" as="image" href="/assets/images/hero-r8/platform-p00-r8-reference-exact.png"',
  '<link rel="preload" as="image" href="/assets/images/hero-r8/truck-t00-r6.png"',
  'id="quote-request-form" action="/api/teklif.php" method="post"',
  'name="adSoyad"', 'name="telefon"', 'name="nereden"', 'name="nereye"', 'name="tarih"', 'name="eposta"', 'name="notlar"', 'name="website"',
  'Edremit / Balıkesir',
  '0535&nbsp;912&nbsp;06&nbsp;91',
  '/js/script.js?v=20260810-03', '/js/hero-animated.js?v=20260809-03', '/js/quote-form.js?v=20260809-01',
]) requireToken('index-template.html', template, token, `production ana sayfa öğesi eksik: ${token}`);

for (const service of [
  '/hizmetler/evden-eve-nakliyat.html',
  '/hizmetler/sehirler-arasi-nakliyat.html',
  '/hizmetler/ofis-isyeri-tasima.html',
  '/hizmetler/asansorlu-tasima.html',
  '/hizmetler/paketleme-montaj.html',
]) requireToken('index-template.html', template, `href="${service}"`, `hizmet bağlantısı eksik: ${service}`);

requireToken('index.php', indexPhp, "__DIR__ . '/index-template.html'", 'private şablon kullanılmalıdır.');
requireToken('index.php', indexPhp, 'readfile($templatePath)', 'şablon doğrudan ve dönüştürülmeden sunulmalıdır.');
requireToken('index.php', indexPhp, "header('X-Hero-Version: R8-11')", 'Hero sürüm başlığı PHP fallback olarak bulunmalıdır.');
requireToken('index.php', indexPhp, "__DIR__ . '/404.html'", 'markalı 404 şablonu kullanılmalıdır.');
requireToken('index.php', indexPhp, 'http_response_code(404)', 'bilinmeyen URL için gerçek 404 durumu verilmelidir.');
requireToken('index.php', indexPhp, "header('X-Robots-Tag: noindex, follow')", '404 yanıtı indekslemeye kapalı olmalıdır.');
if (/str_replace|preg_replace|\\\\n/.test(indexPhp)) failures.push('index.php: kırılgan runtime metin dönüşümü bulunmamalıdır.');

for (const token of [
  "getElementById('quote-request-form')",
  'fetch(endpoint',
  'form.checkValidity()',
  "dateField.type === 'text') dateField.type = 'date'",
  "credentials: 'same-origin'",
  "'Content-Type': 'application/json'",
]) requireToken('js/quote-form.js', quoteJs, token, `form teslim kuralı eksik: ${token}`);
if (quoteJs.includes('stopImmediatePropagation') || quoteJs.includes("getElementById('quote-form')")) failures.push('js/quote-form.js: legacy form çakışma kodu bulunmamalıdır.');

for (const token of [
  'REQUEST_METHOD', 'finish(405', 'requestOriginIsAllowed', 'finish(403', 'finish(413',
  'normalizePhone', "/^[1-9][0-9]{9}$/", 'normalizeMoveDate', "$date < date('Y-m-d')",
  'FILTER_VALIDATE_EMAIL', 'CANPOLAT_QUOTE_FROM_EMAIL', "'info@canpolatnakliyat.com'",
  'mail($recipient', 'website', '429', "'#teklif'",
]) requireToken('api/teklif.php', quoteApi, token, `sunucu tarafı form koruması eksik: ${token}`);

for (const token of [
  'https://www.canpolatnakliyat.com%{REQUEST_URI}',
  'Header always unset X-Okur-Htaccess',
  'Header always set X-Hero-Version "R8-11"',
  'Strict-Transport-Security',
  'Content-Security-Policy',
  "default-src 'self'", "object-src 'none'", "script-src 'self'", "form-action 'self'",
  'X-Robots-Tag "noindex, follow"',
  'AddOutputFilterByType DEFLATE',
]) requireToken('.htaccess', htaccess, token, `güvenlik/performans kuralı eksik: ${token}`);
if (htaccess.includes('fonts.googleapis.com') || htaccess.includes("script-src 'self' 'unsafe-inline'")) failures.push('.htaccess: gereksiz üçüncü taraf veya inline script izni bulunmamalıdır.');

requireToken('robots.txt', robots, 'Disallow: /api/', 'form API yolu taramaya kapalı olmalıdır.');
requireToken('robots.txt', robots, 'Disallow: /index-template.html', 'private şablon taramaya kapalı olmalıdır.');
requireToken('robots.txt', robots, 'Sitemap: https://www.canpolatnakliyat.com/sitemap.xml', 'sitemap adresi canonical origin kullanmalıdır.');

const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
if (sitemapUrls.length !== 12) failures.push(`sitemap.xml: 12 public URL bekleniyor, bulunan ${sitemapUrls.length}.`);
if (new Set(sitemapUrls).size !== sitemapUrls.length) failures.push('sitemap.xml: yinelenen URL bulundu.');
const expectedSitemapUrls = [
  'https://www.canpolatnakliyat.com/',
  'https://www.canpolatnakliyat.com/hakkimizda.html',
  'https://www.canpolatnakliyat.com/galeri.html',
  'https://www.canpolatnakliyat.com/hizmetler/evden-eve-nakliyat.html',
  'https://www.canpolatnakliyat.com/hizmetler/sehirler-arasi-nakliyat.html',
  'https://www.canpolatnakliyat.com/hizmetler/ofis-isyeri-tasima.html',
  'https://www.canpolatnakliyat.com/hizmetler/asansorlu-tasima.html',
  'https://www.canpolatnakliyat.com/hizmetler/paketleme-montaj.html',
  'https://www.canpolatnakliyat.com/hizmetler/parca-esya-tasimaciligi.html',
  'https://www.canpolatnakliyat.com/bolgeler/edremit-nakliyat.html',
  'https://www.canpolatnakliyat.com/gizlilik.html',
  'https://www.canpolatnakliyat.com/sss.html',
];
for (const url of expectedSitemapUrls) if (!sitemapUrls.includes(url)) failures.push(`sitemap.xml: public URL eksik: ${url}`);
for (const url of sitemapUrls) {
  if (!url.startsWith('https://www.canpolatnakliyat.com/')) failures.push(`sitemap.xml: canonical olmayan URL: ${url}`);
}
const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(match => match[1]);
if (lastmods.length !== sitemapUrls.length) failures.push('sitemap.xml: her URL bir lastmod taşımalıdır.');
for (const value of lastmods) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '2026-08-09') failures.push(`sitemap.xml: geçersiz veya bayat lastmod: ${value}`);
}
const galleryImages = [...sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(match => match[1]);
if (galleryImages.length !== 16) failures.push(`sitemap.xml: 16 galeri görseli bekleniyor, bulunan ${galleryImages.length}.`);
for (const url of galleryImages) {
  const file = url.replace('https://www.canpolatnakliyat.com/', '');
  if (!fs.existsSync(path.join(root, file))) failures.push(`sitemap.xml: görsel sunucuda yok: ${file}`);
}

for (const token of [
  'Fiyat teklif formunu kullandığınızda',
  'pazarlama veya reklam iletisi',
  'Kanun’un 11. maddesi',
  'Edremit / Balıkesir',
  'reklam hedefleme, kullanıcı profilleme veya üçüncü taraf analiz amacıyla çerez kullanmaz',
  'Son güncelleme:</strong> 9 Ağustos 2026',
]) requireToken('gizlilik.html', privacy, token, `gizlilik açıklaması eksik: ${token}`);
if (privacy.includes('canpolat_r8_11_cache_reset') || privacy.includes('Altınkum Mah.')) failures.push('gizlilik.html: eski çerez veya adres açıklaması kalmamalıdır.');

requireToken('404.html', notFound, '<meta name="robots" content="noindex, follow">', '404 sayfası indekslenmemelidir.');
if (notFound.includes('rel="canonical"')) failures.push('404.html: 404 sayfasında canonical bulunmamalıdır.');

for (const token of ['"background_color": "#f7f4ee"', '"theme_color": "#253349"', '"lang": "tr-TR"']) requireToken('manifest.webmanifest', manifest, token, `manifest değeri eksik: ${token}`);

for (const token of [
  '"api"', '"assets"', '"css"', '"js"', '"hizmetler"', '"bolgeler"',
  '"api/teklif.php"', '"js/quote-form.js"', '"hizmetler/paketleme-montaj.html"',
]) requireToken('scripts/prepare-deploy.sh', deploy, token, `production paketi öğesi eksik: ${token}`);

for (const token of [
  "getElementById('site-header')", "querySelector('.menu-toggle')", "getElementById('mobile-menu')",
  "document.querySelectorAll('.accordion__item button')", "document.querySelectorAll('[data-year]')",
]) requireToken('js/script.js', mainJs, token, `arayüz etkileşimi eksik: ${token}`);

for (const token of [
  ':root {', '--orange: #ef7c00', '--navy: #253349', '.skip-link', '.mobile-contact-bar',
  '.page-hero', '.content-grid', '.page-aside', '@media (prefers-reduced-motion: reduce)',
]) requireToken('css/style.css', css, token, `tasarım/erişilebilirlik kuralı eksik: ${token}`);

const allProductionText = [template, indexPhp, privacy, notFound, sitemap, robots].join('\n');
for (const forbidden of ['https://canpolatnakliyat.com', 'Altınkum Mah. 108. Sk. No: 5', '0537 226 50 43', 'Kullanım Şartları']) {
  if (allProductionText.includes(forbidden)) failures.push(`Production kaynaklarında eski/geçersiz içerik bulundu: ${forbidden}`);
}

if (failures.length) {
  console.error('Tamamlama denetimi başarısız:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PASS: Form, PHP renderer, SEO metadata, sitemap/robots, NAP/saatler, KVKK, güvenlik başlıkları, responsive arayüz ve deploy paketi doğrulandı.');
