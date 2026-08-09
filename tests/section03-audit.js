const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const phpPath = path.join(root, 'index.php');
const partialPath = path.join(root, 'partials', 'section-03-about.inc');
const cssPath = path.join(root, 'css', 'section-03.css');
const deployPath = path.join(root, 'scripts', 'prepare-deploy.sh');
const htaccessPath = path.join(root, '.htaccess');
const approvedAssetPath = path.join(root, 'assets', 'images', 'about-canpolat-approved.svg');
const obsoleteSvgPath = path.join(root, 'assets', 'images', 'about-canpolat-generated.svg');
const obsoleteJsPath = path.join(root, 'js', 'section-03.js');
const obsoleteHtmlPartialPath = path.join(root, 'partials', 'section-03-about.html');
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

for (const required of [phpPath, partialPath, cssPath, deployPath, htaccessPath, approvedAssetPath]) {
  expect(fs.existsSync(required), `Bölüm 03 dosyası eksik: ${path.relative(root, required)}`);
}

const php = fs.existsSync(phpPath) ? fs.readFileSync(phpPath, 'utf8') : '';
const partial = fs.existsSync(partialPath) ? fs.readFileSync(partialPath, 'utf8') : '';
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
const deploy = fs.existsSync(deployPath) ? fs.readFileSync(deployPath, 'utf8') : '';
const htaccess = fs.existsSync(htaccessPath) ? fs.readFileSync(htaccessPath, 'utf8') : '';
const approvedAsset = fs.existsSync(approvedAssetPath) ? fs.readFileSync(approvedAssetPath, 'utf8') : '';

expect(php.includes("__DIR__ . '/partials/section-03-about.inc'"), 'index.php Bölüm 03 partial dosyasını okumuyor.');
expect(php.includes('$aboutReplaceCount !== 1'), 'Bölüm 03 fail-closed replace koruması eksik.');
expect(php.includes('css/section-03.css?v=20260809-01'), 'Bölüm 03 CSS yüklemesi eksik.');
expect(php.includes('~<section class="about section" id="hakkimizda">.*?</section>~s'), 'Eski Hakkımızda section replacement deseni eksik.');

expect(partial.includes('class="about-v2 section" id="hakkimizda"'), 'Yeni Hakkımızda root markup eksik.');
expect(partial.includes('assets/images/about-canpolat-approved.svg?v=20260809-02'), 'Kullanıcı onaylı Hakkımızda görseli kullanılmıyor.');
expect(partial.includes('assets/images/canpolat-logo.svg?v=20260808-03'), 'Gerçek Canpolat logo asseti overlay olarak kullanılmıyor.');
expect(!partial.includes('about-v2__r8-layer') && !partial.includes('/hero-r8/truck-t00-r6.png'), 'Eski R8 Hakkımızda kompozisyonu kaldırılmadı.');
expect(partial.includes('data-about-brand') && partial.includes('data-about-pin'), 'Logo/açıklama veya Edremit pin overlay katmanı eksik.');
expect(partial.includes('EDREMİT VE ÇEVRESİNDE') && partial.includes('PLANLI TAŞIMA HİZMETLERİ'), 'Görsel üstü marka açıklaması eksik.');
expect(partial.includes('aria-label="Edremit, Balıkesir"'), 'CSS konum işaretinin Edremit/Balıkesir erişilebilir etiketi eksik.');

expect(approvedAsset.includes('viewBox="0 0 1200 900"'), 'Onaylı görsel 4:3 / 1200x900 tuvalini korumuyor.');
expect(approvedAsset.includes('data:image/webp;base64,'), 'Onaylı görsel self-contained WebP içermiyor.');
expect(!approvedAsset.includes('<script'), 'Onaylı görsel asseti script içeremez.');
expect(!approvedAsset.includes('<foreignObject'), 'Onaylı görsel asseti foreignObject içeremez.');

const visualItems = ['Yerel Deneyim', 'Planlı Organizasyon', 'Özenli Paketleme', 'Doğrudan İletişim'];
const serviceItems = ['Evden Eve Nakliyat', 'Şehirler Arası Taşıma', 'Asansörlü Taşıma', 'Ofis ve İşyeri Taşıma'];
for (const item of visualItems) expect(partial.includes(item), `Görsel altı içerik eksik: ${item}`);
for (const item of serviceItems) expect(partial.includes(item), `Paragraf altı hizmet içeriği eksik: ${item}`);
expect(visualItems.every((item) => !serviceItems.includes(item)), 'İki ikon grubunun içerikleri birbirinden ayrışmıyor.');

for (const forbidden of ['Sigortalı Taşıma', 'Zamanında Teslimat', '7/24 Destek', 'yılların deneyimi', 'about-canpolat.webp']) {
  expect(!partial.includes(forbidden), `Yeni Hakkımızda partial içinde eski/doğrulanmamış içerik kaldı: ${forbidden}`);
}

expect(css.includes('.about-v2__approved-image'), 'Onaylı görsel yerleşim stili eksik.');
expect(css.includes('aspect-ratio: 4 / 3'), 'Onaylı Hakkımızda görsel oranı korunmuyor.');
expect(css.includes('.about-v2.is-visible .about-v2__brand-overlay'), 'Logo/açıklama reveal stili eksik.');
expect(css.includes('.about-v2.is-visible .about-v2__pin-wrap'), 'Edremit pin reveal stili eksik.');
expect(css.includes('left: 47.8%') && css.includes('top: 24.8%'), 'Edremit pininin onaylı görsel üzerindeki Balıkesir koordinatı korunmuyor.');
expect(css.includes('@keyframes aboutPinPulse'), 'Edremit pin pulse animasyonu eksik.');
expect(css.includes('@media (prefers-reduced-motion: reduce)'), 'Bölüm 03 reduced-motion desteği eksik.');
expect(css.includes('grid-template-columns: repeat(4, minmax(0,1fr));'), 'Görsel altı masaüstü 4 ikon düzeni eksik.');
expect(css.includes('grid-template-columns: repeat(2, minmax(0,1fr));'), 'İki sütunlu hizmet/kompakt düzen kuralları eksik.');

expect(deploy.includes('"partials"'), 'Deploy paketine partials klasörü dahil değil.');
expect(deploy.includes('"partials/section-03-about.inc"'), 'Deploy doğrulamasında Bölüm 03 partial eksik.');
expect(deploy.includes('"css/section-03.css"'), 'Deploy doğrulamasında Bölüm 03 CSS eksik.');
expect(htaccess.includes('RewriteRule ^partials/ - [F,L,NC]'), 'Partial dosyaları web erişimine karşı korunmuyor.');
expect(!fs.existsSync(obsoleteSvgPath), 'Eski deneme about SVG dosyası hâlâ repoda.');
expect(!fs.existsSync(obsoleteJsPath), 'Gereksiz section-03.js hâlâ repoda.');
expect(!fs.existsSync(obsoleteHtmlPartialPath), 'Eski .html partial hâlâ repo audit kapsamına giriyor.');

if (failures.length) {
  console.error('BÖLÜM 03 STATIC AUDIT FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('BÖLÜM 03 STATIC AUDIT PASS');
console.log('- Kullanıcı onaylı 4:3 Hakkımızda görsel asseti doğrulandı');
console.log('- Gerçek logo/açıklama overlay ve CSS Edremit/Balıkesir pini doğrulandı');
console.log('- Eski R8 Hakkımızda kompozisyonunun kaldırıldığı doğrulandı');
console.log('- Görsel altı ve paragraf altı iki farklı ikon grubu doğrulandı');
console.log('- Eski Hakkımızda 404 asset bağımlılığı kaldırıldı');
console.log('- Deploy ve private partial korumaları doğrulandı');