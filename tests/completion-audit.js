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

const indexPhp = read('index.php');
const quoteJs = read('js/quote-form.js');
const quoteApi = read('api/teklif.php');
const htaccess = read('.htaccess');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const privacy = read('gizlilik.html');
const notFound = read('404.html');
const deploy = read('scripts/prepare-deploy.sh');
const packageService = read('hizmetler/paketleme-montaj.html');
const staticCss = read('assets/css/style.css');
const staticJs = read('assets/js/main.js');

requireToken('index.php', indexPhp, 'https://canpolatnakliyat.com/', 'canonical production alan adı non-www olmalıdır.');
requireToken('index.php', indexPhp, 'id="quote-request-form" action="/api/teklif.php" method="post"', 'production teklif formu legacy demo ID’sinden ayrılmalı ve gerçek POST endpointine bağlanmalıdır.');
requireToken('index.php', indexPhp, 'js/quote-form.js', 'form teslim JavaScript dosyası yüklenmelidir.');
requireToken('index.php', indexPhp, 'Taşıma kapsamı, sorumluluklar ve varsa ek güvence seçenekleri', 'sigorta/ek güvence kapsamı koşulsuz garanti gibi sunulmamalıdır.');
requireToken('index.php', indexPhp, 'Taşıma kapsamında sökülen ve yeniden kuruluma uygun mobilyalara montaj desteği sağlıyoruz.', 'montaj kapsamı uygun mobilyalarla sınırlandırılmalıdır.');
requireToken('index.php', indexPhp, 'Edremit ve çevresinde planlı, özenli ve ulaşılabilir nakliyat hizmeti.', 'CTA koşulsuz sigorta vaadi içermemelidir.');
for (const service of [
  '/hizmetler/evden-eve-nakliyat.html',
  '/hizmetler/sehirler-arasi-nakliyat.html',
  '/hizmetler/ofis-isyeri-tasima.html',
  '/hizmetler/asansorlu-tasima.html',
  '/hizmetler/paketleme-montaj.html',
]) {
  requireToken('index.php', indexPhp, service, `hizmet kartı hedefi eksik: ${service}`);
}

requireToken('js/quote-form.js', quoteJs, "getElementById('quote-request-form')", 'gerçek form JS’si production form ID’sini kullanmalıdır.');
requireToken('js/quote-form.js', quoteJs, 'fetch(endpoint', 'form gönderimi fetch ile yapılmalıdır.');
requireToken('js/quote-form.js', quoteJs, 'form.checkValidity()', 'tarayıcı form doğrulaması korunmalıdır.');
requireToken('js/quote-form.js', quoteJs, "dateField.type === 'text') dateField.type = 'date'", 'taşınma tarihi alanı yeni form JS’sinde tarih seçiciye yükseltilmelidir.');
if (quoteJs.includes('stopImmediatePropagation')) failures.push('js/quote-form.js: production form artık legacy handler ile çakışmadığı için stopImmediatePropagation kullanılmamalıdır.');
if (quoteJs.includes("getElementById('quote-form')")) failures.push('js/quote-form.js: legacy demo form ID’si kullanılmamalıdır.');

requireToken('api/teklif.php', quoteApi, 'REQUEST_METHOD', 'endpoint yalnız POST kabul etmelidir.');
requireToken('api/teklif.php', quoteApi, 'finish(405', 'POST dışı istekler 405 dönmelidir.');
requireToken('api/teklif.php', quoteApi, 'requestOriginIsAllowed', 'bilinen yabancı origin istekleri reddedilmelidir.');
requireToken('api/teklif.php', quoteApi, 'finish(403', 'origin doğrulama hatası 403 dönmelidir.');
requireToken('api/teklif.php', quoteApi, 'finish(413', 'aşırı büyük form gövdesi reddedilmelidir.');
requireToken('api/teklif.php', quoteApi, 'normalizePhone', 'telefon numarası normalize edilmelidir.');
requireToken('api/teklif.php', quoteApi, "/^[1-9][0-9]{9}$/", 'Türkiye ulusal formatında sabit veya cep telefonu kabul edilmelidir.');
requireToken('api/teklif.php', quoteApi, 'normalizeMoveDate', 'taşınma tarihi gerçek bir takvim tarihi olarak normalize edilmelidir.');
requireToken('api/teklif.php', quoteApi, "$date < date('Y-m-d')", 'geçmiş taşınma tarihi sunucu tarafında reddedilmelidir.');
requireToken('api/teklif.php', quoteApi, 'FILTER_VALIDATE_EMAIL', 'e-posta sunucu tarafında doğrulanmalıdır.');
requireToken('api/teklif.php', quoteApi, 'CANPOLAT_QUOTE_FROM_EMAIL', 'mail From adresi güvenli ve yapılandırılabilir olmalıdır.');
requireToken('api/teklif.php', quoteApi, "'info@canpolatnakliyat.com'", 'varsayılan mail alanı mevcut iletişim adresiyle aynı olmalıdır.');
requireToken('api/teklif.php', quoteApi, 'mail($recipient', 'doğrulanan teklif talebi e-posta ile teslim edilmelidir.');
requireToken('api/teklif.php', quoteApi, 'website', 'spam honeypot kontrolü bulunmalıdır.');
requireToken('api/teklif.php', quoteApi, '429', 'hızlı tekrar gönderimleri sınırlanmalıdır.');

requireToken('.htaccess', htaccess, 'https://canpolatnakliyat.com%{REQUEST_URI}', 'HTTPS + non-www canonical yönlendirmesi bulunmalıdır.');
requireToken('.htaccess', htaccess, 'Strict-Transport-Security', 'HSTS başlığı bulunmalıdır.');
requireToken('.htaccess', htaccess, 'Content-Security-Policy', 'CSP başlığı bulunmalıdır.');
requireToken('.htaccess', htaccess, 'X-Robots-Tag "noindex, follow"', '404 yanıtı X-Robots-Tag ile noindex olmalıdır.');

requireToken('robots.txt', robots, 'Disallow: /api/', 'form API yolu taramaya kapalı olmalıdır.');
requireToken('robots.txt', robots, 'Disallow: /index-template.html', 'private template taramaya kapalı olmalıdır.');
requireToken('sitemap.xml', sitemap, 'https://canpolatnakliyat.com/hizmetler/paketleme-montaj.html', 'Paketleme ve Montaj sayfası sitemap içinde olmalıdır.');

requireToken('404.html', notFound, '<meta name="robots" content="noindex, follow">', '404 sayfası indekslenmemelidir.');
if (notFound.includes('rel="canonical"')) failures.push('404.html: 404 sayfasında canonical bulunmamalıdır.');

requireToken('gizlilik.html', privacy, 'Fiyat teklif formunu kullandığınızda', 'formda toplanan veriler açıklanmalıdır.');
requireToken('gizlilik.html', privacy, 'canpolat_r8_11_cache_reset', 'teknik çerez açıklanmalıdır.');
requireToken('gizlilik.html', privacy, 'Kanun’un 11. maddesi', 'ilgili kişi hakları açıklanmalıdır.');
requireToken('gizlilik.html', privacy, 'pazarlama veya reklam iletisi', 'teklif talebinin pazarlama onayı olmadığı belirtilmelidir.');

requireToken('hizmetler/paketleme-montaj.html', packageService, '<h1>Paketleme ve Montaj</h1>', 'eksik hizmet detay sayfası tamamlanmalıdır.');
requireToken('scripts/prepare-deploy.sh', deploy, '"api"', 'API klasörü production paketine dahil edilmelidir.');
requireToken('scripts/prepare-deploy.sh', deploy, '"js/quote-form.js"', 'quote-form.js production paketinde zorunlu olmalıdır.');
requireToken('scripts/prepare-deploy.sh', deploy, '"hizmetler/paketleme-montaj.html"', 'yeni hizmet sayfası production paketinde zorunlu olmalıdır.');

const publicPages = [
  'hakkimizda.html',
  'gizlilik.html',
  'bolgeler/edremit-nakliyat.html',
  'hizmetler/evden-eve-nakliyat.html',
  'hizmetler/sehirler-arasi-nakliyat.html',
  'hizmetler/ofis-isyeri-tasima.html',
  'hizmetler/asansorlu-tasima.html',
  'hizmetler/paketleme-montaj.html',
];

for (const page of publicPages) {
  const html = read(page);
  requireToken(page, html, '<meta name="theme-color" content="#06121b">', 'production tema rengi #06121b olmalıdır.');
  requireToken(page, html, 'rel="icon" href="/assets/images/favicon-canpolat.svg"', 'favicon gerçek favicon dosyasını kullanmalıdır.');
  requireToken(page, html, 'rel="manifest" href="/manifest.webmanifest"', 'manifest bağlantısı bulunmalıdır.');
  requireToken(page, html, 'https://canpolatnakliyat.com/', 'canonical/OG adresleri non-www production origin kullanmalıdır.');
  if (html.includes('media="print" onload=')) failures.push(`${page}: CSP'ye bağımlı eski inline font onload yöntemi kullanılmamalıdır.`);
  if (/<link\s+rel="icon"[^>]+canpolat-logo\.svg/i.test(html)) failures.push(`${page}: marka logosu favicon olarak kullanılmamalıdır.`);
  if (html.includes('https://www.canpolatnakliyat.com')) failures.push(`${page}: www origin kullanılmamalıdır.`);
}

const serviceNavigationPages = [
  'hakkimizda.html',
  'bolgeler/edremit-nakliyat.html',
  'hizmetler/evden-eve-nakliyat.html',
  'hizmetler/sehirler-arasi-nakliyat.html',
  'hizmetler/ofis-isyeri-tasima.html',
  'hizmetler/asansorlu-tasima.html',
  'hizmetler/paketleme-montaj.html',
];
for (const page of serviceNavigationPages) {
  const html = read(page);
  requireToken(page, html, '/hizmetler/paketleme-montaj.html', 'beşinci hizmet olan Paketleme & Montaj bağlantısı bulunmalıdır.');
  requireToken(page, html, 'alt="Canpolat Nakliyat"', 'marka logo alt metni genel marka adıyla tutarlı olmalıdır.');
}

requireToken('assets/js/main.js', staticJs, "document.documentElement.classList.add('has-js')", 'reveal animasyonu yalnız JavaScript etkin olduğunda devreye alınmalıdır.');
requireToken('assets/css/style.css', staticCss, '.reveal{opacity:1;filter:none;transform:none}', 'JS olmadan reveal içeriği görünür kalmalıdır.');
requireToken('assets/css/style.css', staticCss, 'html.has-js .reveal{opacity:0', 'JS etkin olduğunda reveal animasyon başlangıcı uygulanmalıdır.');

if (failures.length) {
  console.error('Tamamlama denetimi başarısız:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PASS: Production tamamlama denetimi başarılı.');
