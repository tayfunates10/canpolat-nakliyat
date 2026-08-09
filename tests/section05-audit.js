const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const phpPath = path.join(root, 'index.php');
const partialPath = path.join(root, 'partials', 'section-05-why-us.inc');
const cssPath = path.join(root, 'css', 'section-05.css');
const jsPath = path.join(root, 'js', 'section-05.js');
const deployPath = path.join(root, 'scripts', 'prepare-deploy.sh');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

for (const file of [phpPath, partialPath, cssPath, jsPath, deployPath]) {
  expect(fs.existsSync(file), `Bölüm 05 dosyası eksik: ${path.relative(root, file)}`);
}

const php = fs.existsSync(phpPath) ? fs.readFileSync(phpPath, 'utf8') : '';
const partial = fs.existsSync(partialPath) ? fs.readFileSync(partialPath, 'utf8') : '';
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
const js = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : '';
const deploy = fs.existsSync(deployPath) ? fs.readFileSync(deployPath, 'utf8') : '';

expect(php.includes("__DIR__ . '/partials/section-05-why-us.inc'"), 'index.php Bölüm 05 partial dosyasını okumuyor.');
expect(php.includes("$whyUsAnchor = '<section class=\"faq-form section\" id=\"sss\">';"), 'Bölüm 05 SSS öncesi ekleme ankrajı eksik.');
expect(php.includes('substr_count($html, $whyUsAnchor) !== 1'), 'Bölüm 05 fail-closed ankraj doğrulaması eksik.');
expect(php.includes("strpos($html, 'id=\"neden-biz\"') !== false"), 'Bölüm 05 çift ekleme koruması eksik.');
expect(php.includes('css/section-05.css?v=20260809-01'), 'Bölüm 05 CSS yüklemesi eksik.');
expect(php.includes('js/section-05.js?v=20260809-01'), 'Bölüm 05 JS yüklemesi eksik.');

expect(partial.includes('class="why-us-v2 section" id="neden-biz"'), 'Bölüm 05 root markup eksik.');
expect(partial.includes('aria-labelledby="why-us-v2-title"'), 'Bölüm 05 erişilebilir başlık bağlantısı eksik.');
expect((partial.match(/class="why-us-v2__card"/g) || []).length === 4, 'Bölüm 05 tam 4 ana kart içermiyor.');
expect((partial.match(/<svg viewBox="0 0 64 64"/g) || []).length === 4, 'Bölüm 05 dört ana dolu ikon SVG içermiyor.');
expect((partial.match(/fill="currentColor"/g) || []).length >= 6, 'Bölüm 05 ikonları dolu fill SVG olarak tanımlanmamış.');
expect(!partial.includes('stroke="currentColor"'), 'Bölüm 05 ana ikonlarında çizgi/stroke kullanılmamalı.');

const titles = [
  'Edremit Odaklı Planlama',
  'Net Hizmet Kapsamı',
  'Eşyaya Göre Hazırlık',
  'Doğrudan İletişim',
];
const tags = ['Yerel planlama', 'Açık kapsam', 'Uygun hazırlık', 'Kolay ulaşım'];
for (const title of titles) expect(partial.includes(title), `Bölüm 05 kart başlığı eksik: ${title}`);
for (const tag of tags) expect(partial.includes(tag), `Bölüm 05 kart etiketi eksik: ${tag}`);
for (const text of ['4 TEMEL NOKTA', 'Planlama', 'Kapsam', 'Hazırlık', 'İletişim']) {
  expect(partial.includes(text), `Bölüm 05 manifesto içeriği eksik: ${text}`);
}

expect(partial.includes('tel:+905359120691'), 'Bölüm 05 telefon bağlantısı yanlış/eksik.');
expect(partial.includes('https://wa.me/905359120691'), 'Bölüm 05 WhatsApp bağlantısı yanlış/eksik.');
expect(partial.includes('target="_blank"') && partial.includes('rel="noopener"'), 'Bölüm 05 WhatsApp güvenlik nitelikleri eksik.');

for (const forbidden of [
  '20 yıllık', '20 Yıllık', '%100', 'garantili', 'Garantili', 'Sigortalı', 'sigortalı',
  'en hızlı', 'En Hızlı', 'müşteri memnuniyeti', 'Müşteri Memnuniyeti',
]) {
  expect(!partial.includes(forbidden), `Bölüm 05 doğrulanmamış iddia içeriyor: ${forbidden}`);
}

expect(css.includes('grid-template-columns: minmax(320px, 0.72fr) minmax(0, 1.28fr);'), 'Bölüm 05 masaüstü ana iki sütun düzeni eksik.');
expect(css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));'), 'Bölüm 05 masaüstü/tablet 2x2 kart düzeni eksik.');
expect(css.includes('@media (max-width: 767px)') && css.includes('.why-us-v2__grid') && css.includes('grid-template-columns: 1fr;'), 'Bölüm 05 mobil tek sütun düzeni eksik.');
expect(css.includes('.why-us-v2.why-us-motion-ready:not(.is-visible) .why-us-v2__card'), 'Bölüm 05 reveal başlangıç stili eksik.');
expect(css.includes('@media (prefers-reduced-motion: reduce)'), 'Bölüm 05 reduced-motion stili eksik.');
expect(css.includes('.why-us-v2__phone:focus-visible') && css.includes('.why-us-v2__whatsapp:focus-visible'), 'Bölüm 05 klavye focus stili eksik.');

expect(js.includes('IntersectionObserver'), 'Bölüm 05 reveal davranışı IntersectionObserver kullanmıyor.');
expect(js.includes("prefers-reduced-motion: reduce"), 'Bölüm 05 JS reduced-motion kontrolü eksik.');
expect(js.includes("section.classList.add('why-us-motion-ready')"), 'Bölüm 05 motion-ready sınıfı eksik.');
expect(js.includes("section.classList.add('is-visible')"), 'Bölüm 05 görünürlük sınıfı eksik.');

for (const required of ['css/section-05.css', 'partials/section-05-why-us.inc', 'js/section-05.js']) {
  expect(deploy.includes(`"${required}"`), `Deploy manifestinde Bölüm 05 dosyası eksik: ${required}`);
}

if (failures.length) {
  console.error('BÖLÜM 05 STATIC AUDIT FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('BÖLÜM 05 STATIC AUDIT PASS');
console.log('- 4 dolu/simetrik ikonlu Neden Biz kartı doğrulandı');
console.log('- Edremit odaklı planlama / net kapsam / uygun hazırlık / doğrudan iletişim metinleri doğrulandı');
console.log('- Masaüstü 2x2 kart / mobil tek sütun düzeni doğrulandı');
console.log('- Telefon + WhatsApp, focus-visible ve reduced-motion doğrulandı');
console.log('- Server-side fail-closed ekleme ve deploy zorunlulukları doğrulandı');
