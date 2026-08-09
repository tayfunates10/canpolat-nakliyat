const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const phpPath = path.join(root, 'index.php');
const partialPath = path.join(root, 'partials', 'section-03-about.inc');
const cssPath = path.join(root, 'css', 'section-03.css');
const deployPath = path.join(root, 'scripts', 'prepare-deploy.sh');
const htaccessPath = path.join(root, '.htaccess');
const endpointPath = path.join(root, 'assets', 'images', 'about-canpolat-approved.php');
const partsDir = path.join(root, 'assets', 'images', 'about-canpolat-approved-parts');
const partNames = [
  'part-01.b64', 'part-02.b64', 'part-03.b64', 'part-04.b64', 'part-05.b64',
  'part-06.b64', 'part-07a.b64', 'part-07b.b64', 'part-08.b64',
];
const expectedSize = 39512;
const expectedSha = '21104ece60551cfc8756097d06a5feb968f797b57086da6ad73db60e5bc6ca00';
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

for (const required of [phpPath, partialPath, cssPath, deployPath, htaccessPath, endpointPath, partsDir]) {
  expect(fs.existsSync(required), `Bölüm 03 dosyası eksik: ${path.relative(root, required)}`);
}
for (const part of partNames) {
  expect(fs.existsSync(path.join(partsDir, part)), `Onaylı Hakkımızda görsel parçası eksik: ${part}`);
}

const php = fs.existsSync(phpPath) ? fs.readFileSync(phpPath, 'utf8') : '';
const partial = fs.existsSync(partialPath) ? fs.readFileSync(partialPath, 'utf8') : '';
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
const deploy = fs.existsSync(deployPath) ? fs.readFileSync(deployPath, 'utf8') : '';
const htaccess = fs.existsSync(htaccessPath) ? fs.readFileSync(htaccessPath, 'utf8') : '';
const endpoint = fs.existsSync(endpointPath) ? fs.readFileSync(endpointPath, 'utf8') : '';

expect(php.includes("__DIR__ . '/partials/section-03-about.inc'"), 'index.php Bölüm 03 partial dosyasını okumuyor.');
expect(php.includes('$aboutReplaceCount !== 1'), 'Bölüm 03 fail-closed replace koruması eksik.');
expect(php.includes('css/section-03.css?v=20260809-01'), 'Bölüm 03 CSS yüklemesi eksik.');

expect(partial.includes('class="about-v2 section" id="hakkimizda"'), 'Hakkımızda root markup eksik.');
expect(partial.includes('assets/images/about-canpolat-approved.php?v=20260809-06'), 'Onaylı WebP endpointi partial içinde kullanılmıyor.');
expect(partial.includes('width="900" height="675"'), 'Onaylı Hakkımızda görsel ölçü ipucu 900x675 değil.');
expect(partial.includes('assets/images/canpolat-logo.svg?v=20260808-03'), 'Gerçek Canpolat logo overlay’i kullanılmıyor.');
expect(partial.includes('aria-label="Edremit, Balıkesir"'), 'Edremit/Balıkesir CSS pini etiketi eksik.');
expect(!partial.includes('about-v2__r8-layer'), 'Eski R8 Hakkımızda kompozisyonu kaldırılmadı.');

let encoded = '';
for (const part of partNames) {
  const file = path.join(partsDir, part);
  if (fs.existsSync(file)) encoded += fs.readFileSync(file, 'utf8').trim();
}
expect(encoded.length === 52684, `Onaylı Hakkımızda base64 uzunluğu değişti: ${encoded.length}`);
let webp = Buffer.alloc(0);
try { webp = Buffer.from(encoded, 'base64'); } catch (_) {}
const hash = crypto.createHash('sha256').update(webp).digest('hex');
expect(webp.length === expectedSize, `Onaylı WebP boyutu değişti: ${webp.length}`);
expect(hash === expectedSha, `Onaylı WebP SHA256 değişti: ${hash}`);
expect(webp.subarray(0, 4).toString('ascii') === 'RIFF' && webp.subarray(8, 12).toString('ascii') === 'WEBP', 'Onaylı görsel geçerli RIFF/WEBP magic byte taşımıyor.');

expect(endpoint.includes("$expectedSize = 39512;"), 'WebP endpoint boyut kilidi eksik.');
expect(endpoint.includes(expectedSha), 'WebP endpoint SHA256 kilidi eksik.');
expect(endpoint.includes("header('Content-Type: image/webp')"), 'WebP endpoint MIME başlığı eksik.');
expect(endpoint.includes("Cache-Control: public, max-age=31536000, immutable"), 'WebP endpoint immutable cache başlığı eksik.');
expect(endpoint.includes("X-Content-Type-Options: nosniff"), 'WebP endpoint nosniff başlığı eksik.');

const visualItems = ['Yerel Deneyim', 'Planlı Organizasyon', 'Özenli Paketleme', 'Doğrudan İletişim'];
const serviceItems = ['Evden Eve Nakliyat', 'Şehirler Arası Taşıma', 'Asansörlü Taşıma', 'Ofis ve İşyeri Taşıma'];
for (const item of visualItems) expect(partial.includes(item), `Görsel altı içerik eksik: ${item}`);
for (const item of serviceItems) expect(partial.includes(item), `Paragraf altı hizmet içeriği eksik: ${item}`);
expect(visualItems.every((item) => !serviceItems.includes(item)), 'İki ikon grubunun içerikleri birbirinden ayrışmıyor.');
for (const forbidden of ['Sigortalı Taşıma', 'Zamanında Teslimat', '7/24 Destek', 'yılların deneyimi', 'about-canpolat.webp']) {
  expect(!partial.includes(forbidden), `Yeni Hakkımızda içinde eski/doğrulanmamış içerik kaldı: ${forbidden}`);
}

expect(css.includes('.about-v2__approved-image'), 'Onaylı görsel yerleşim stili eksik.');
expect(css.includes('aspect-ratio: 4 / 3'), 'Hakkımızda görsel oranı 4:3 değil.');
expect(css.includes('.about-v2.is-visible .about-v2__brand-overlay'), 'Logo/açıklama reveal stili eksik.');
expect(css.includes('.about-v2.is-visible .about-v2__pin-wrap'), 'Edremit pin reveal stili eksik.');
expect(css.includes('left: 47.8%') && css.includes('top: 24.8%'), 'Edremit pin koordinatı değişmiş.');
expect(css.includes('@keyframes aboutPinPulse'), 'Edremit pin pulse animasyonu eksik.');
expect(css.includes('@media (prefers-reduced-motion: reduce)'), 'Bölüm 03 reduced-motion desteği eksik.');

expect(deploy.includes('"partials/section-03-about.inc"'), 'Deploy doğrulamasında Bölüm 03 partial eksik.');
expect(deploy.includes('"css/section-03.css"'), 'Deploy doğrulamasında Bölüm 03 CSS eksik.');
expect(deploy.includes('"assets/images/about-canpolat-approved.php"'), 'Deploy doğrulamasında onaylı WebP endpointi eksik.');
expect(deploy.includes('"assets/images/about-canpolat-approved-parts"'), 'Deploy doğrulamasında onaylı görsel parçaları eksik.');
expect(htaccess.includes('RewriteRule ^partials/ - [F,L,NC]'), 'Partial dosyaları web erişimine karşı korunmuyor.');

if (failures.length) {
  console.error('BÖLÜM 03 STATIC AUDIT FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('BÖLÜM 03 STATIC AUDIT PASS');
console.log('- Onaylı Hakkımızda WebP 9 parçadan byte-for-byte yeniden oluşturuldu');
console.log('- 39512 byte + SHA256 + RIFF/WEBP kilidi doğrulandı');
console.log('- Gerçek logo/açıklama overlay ve CSS Edremit/Balıkesir pini doğrulandı');
console.log('- İki farklı ikon grubu ve reduced-motion altyapısı doğrulandı');
console.log('- Server-side endpoint, deploy ve private partial korumaları doğrulandı');
