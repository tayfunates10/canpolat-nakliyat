const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cssPath = path.join(root, 'css', 'services-tune.css');
const phpPath = path.join(root, 'index.php');
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(fs.existsSync(cssPath), 'css/services-tune.css bulunamadı.');
expect(fs.existsSync(phpPath), 'index.php bulunamadı.');

const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
const php = fs.existsSync(phpPath) ? fs.readFileSync(phpPath, 'utf8') : '';

expect(css.includes('grid-template-columns: repeat(5, minmax(0, 1fr));'), 'Masaüstü 5 kart düzeni eksik.');
expect(/@media\s*\(max-width:\s*991px\)\s*and\s*\(min-width:\s*768px\)[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(css), 'Tablet 3 sütun düzeni eksik.');
expect(/@media\s*\(max-width:\s*767px\)[\s\S]*?\.service-card\s*\{[\s\S]*?grid-template-columns:\s*132px\s+minmax\(0,\s*1fr\)\s+24px/.test(css), 'Mobil yatay kart düzeni eksik.');
expect(css.includes('counter-reset: service-card;') && css.includes('counter(service-card, decimal-leading-zero)'), '01–05 hizmet numaralandırması eksik.');
expect(css.includes('aspect-ratio: 793 / 496;'), 'Onaylı hizmet görsel oranı korunmuyor.');
expect(css.includes('object-fit: contain;'), 'Hizmet görsellerini kırpmama kuralı eksik.');
expect(css.includes('@media (prefers-reduced-motion: reduce)'), 'Reduced-motion desteği eksik.');
expect(css.includes('clip-path: none;') && css.includes('white-space: normal;'), 'Mobil bölüm başlığını geri açan kural eksik.');

expect(php.includes("css/services-tune.css?v=20260808-svc-03', 'css/services-tune.css?v=20260809-svc-04"), 'Bölüm 02 CSS cache-bust dönüşümü eksik.');

const replacements = [
  ['Eşyalarınızı özenle paketliyor, güvenle yeni adresinize ulaştırıyoruz.', 'Eşyalarınızı özenle paketleyip planlı şekilde yeni adresinize taşıyoruz.'],
  ["Türkiye'nin her yerine güvenli, planlı ve zamanında taşıma hizmeti.", 'Şehirler arası taşıma sürecini rota ve eşya durumuna göre planlıyoruz.'],
  ['Ofis, büro ve iş yerlerinizi en kısa sürede yeni adresinize taşıyoruz.', 'Ofis ve iş yeri taşımalarını iş akışını gözeterek düzenli şekilde yürütüyoruz.'],
  ['Yüksek katlara hızlı, güvenli ve hasarsız taşıma imkanı.', 'Bina ve çevre koşulları uygunsa dış cephe taşıma asansörü kullanıyoruz.'],
  ['Profesyonel paketleme ve uzman montaj ekibimizle hizmetinizdeyiz.', 'Taşıma kapsamına uygun paketleme ve yeniden kurulum desteği sağlıyoruz.'],
];

for (const [oldText, newText] of replacements) {
  expect(php.includes(oldText) && php.includes(newText), `Hizmet metin dönüşümü eksik: ${newText}`);
}

const expectedUrls = [
  '/hizmetler/evden-eve-nakliyat.html',
  '/hizmetler/sehirler-arasi-nakliyat.html',
  '/hizmetler/ofis-isyeri-tasima.html',
  '/hizmetler/asansorlu-tasima.html',
  '/hizmetler/paketleme-montaj.html',
];
for (const url of expectedUrls) expect(php.includes(url), `Hizmet detay URL'si eksik: ${url}`);

if (failures.length) {
  console.error('BÖLÜM 02 STATIC AUDIT FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('BÖLÜM 02 STATIC AUDIT PASS');
console.log('- Masaüstü 5 kart / tablet 3+2 / mobil yatay satır yapısı doğrulandı');
console.log('- Onaylı görsel oranı ve contain davranışı doğrulandı');
console.log('- Güvenli hizmet metinleri ve 5 detay URL’si doğrulandı');
console.log('- CSS cache-bust ve reduced-motion desteği doğrulandı');
