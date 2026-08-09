const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const phpPath = path.join(root, 'index.php');
const partialPath = path.join(root, 'partials', 'section-04-process.inc');
const cssPath = path.join(root, 'css', 'section-04.css');
const jsPath = path.join(root, 'js', 'section-04.js');
const deployPath = path.join(root, 'scripts', 'prepare-deploy.sh');
const failures = [];

const expect = (condition, message) => { if (!condition) failures.push(message); };
for (const file of [phpPath, partialPath, cssPath, jsPath, deployPath]) {
  expect(fs.existsSync(file), `Bölüm 04 dosyası eksik: ${path.relative(root, file)}`);
}

const php = fs.existsSync(phpPath) ? fs.readFileSync(phpPath, 'utf8') : '';
const partial = fs.existsSync(partialPath) ? fs.readFileSync(partialPath, 'utf8') : '';
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
const js = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : '';
const deploy = fs.existsSync(deployPath) ? fs.readFileSync(deployPath, 'utf8') : '';

expect(php.includes("__DIR__ . '/partials/section-04-process.inc'"), 'index.php Bölüm 04 partial dosyasını okumuyor.');
expect(php.includes('$processReplaceCount !== 1'), 'Bölüm 04 fail-closed replace koruması eksik.');
expect(php.includes('~<section class="process section" id="tasima-sureci">.*?</section>~s'), 'Eski process section replacement deseni eksik.');
expect(php.includes('css/section-04.css?v=20260809-01'), 'Bölüm 04 CSS yüklemesi eksik.');
expect(php.includes('js/section-04.js?v=20260809-01'), 'Bölüm 04 JS yüklemesi eksik.');

expect(partial.includes('class="process-v2 section" id="tasima-sureci"'), 'Yeni Bölüm 04 root markup eksik.');
expect(partial.includes('<ol class="process-v2__list"'), 'Taşıma süreci semantik ol listesi değil.');
expect((partial.match(/class="process-v2__card"/g) || []).length === 4, 'Bölüm 04 tam 4 süreç kartı içermiyor.');
expect((partial.match(/<svg viewBox="0 0 64 64"/g) || []).length === 4, 'Bölüm 04 dört ana ikon SVG içermiyor.');
expect((partial.match(/fill="currentColor"/g) || []).length >= 4, 'Ana ikonlar dolu fill SVG olarak tanımlanmamış.');
expect(!partial.includes('stroke="currentColor"'), 'Ana süreç ikonları çizgi/stroke ikon olmamalı.');

const steps = ['Adım 1', 'Adım 2', 'Adım 3', 'Adım 4'];
const titles = ['İlk İletişim', 'Planlama', 'Hazırlık &amp; Yükleme', 'Taşıma &amp; Teslim'];
const metas = ['Hızlı başlangıç', 'Net program', 'Düzenli hazırlık', 'Kontrollü teslim'];
for (const step of steps) expect(partial.includes(step), `Üst adım etiketi eksik: ${step}`);
for (const title of titles) expect(partial.includes(title), `Süreç başlığı eksik: ${title}`);
for (const meta of metas) expect(partial.includes(meta), `Alt estetik etiket eksik: ${meta}`);

expect(partial.includes('https://wa.me/905359120691'), 'Bölüm 04 WhatsApp URL yanlış/eksik.');
expect(partial.includes('target="_blank"') && partial.includes('rel="noopener"'), 'WhatsApp dış bağlantı güvenlik nitelikleri eksik.');
for (const forbidden of ['Ücretsiz ekspertiz', 'güvenle aracımıza yüklüyoruz', 'montajını yapıyoruz']) {
  expect(!partial.includes(forbidden), `Doğrulanmamış/eski süreç ifadesi kaldı: ${forbidden}`);
}

expect(css.includes('grid-template-columns: repeat(4, minmax(0, 1fr));'), 'Masaüstü 4 sütun süreç düzeni eksik.');
expect(css.includes('@media (max-width: 1100px)') && css.includes('grid-template-columns: repeat(2, minmax(0,1fr));'), 'Tablet 2x2 süreç düzeni eksik.');
expect(css.includes('@media (max-width: 767px)') && css.includes('grid-template-columns: 1fr;'), 'Mobil dikey timeline düzeni eksik.');
expect(css.includes('.process-v2__list::before'), 'Süreç ilerleme hattı eksik.');
expect(css.includes('.process-v2__node'), 'Süreç timeline düğümü eksik.');
expect(css.includes('.process-v2.is-visible .process-v2__card'), 'Kart reveal stili eksik.');
expect(css.includes('@media (prefers-reduced-motion: reduce)'), 'Bölüm 04 reduced-motion stili eksik.');
expect(css.includes('.process-v2__cta-link:focus-visible'), 'Bölüm 04 CTA focus-visible stili eksik.');

expect(js.includes('IntersectionObserver'), 'Bölüm 04 görünürlük animasyonu IntersectionObserver kullanmıyor.');
expect(js.includes("prefers-reduced-motion: reduce"), 'Bölüm 04 JS reduced-motion kontrolü eksik.');
expect(js.includes("section.classList.add('is-visible')"), 'Bölüm 04 reveal class uygulaması eksik.');

for (const required of ['css/section-04.css', 'partials/section-04-process.inc', 'js/section-04.js']) {
  expect(deploy.includes(`"${required}"`), `Deploy manifestinde Bölüm 04 dosyası eksik: ${required}`);
}

if (failures.length) {
  console.error('BÖLÜM 04 STATIC AUDIT FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('BÖLÜM 04 STATIC AUDIT PASS');
console.log('- 4 dolu/simetrik ikonlu kart ve Adım 1–4 etiketleri doğrulandı');
console.log('- Alt etiketler: Hızlı başlangıç / Net program / Düzenli hazırlık / Kontrollü teslim');
console.log('- Masaüstü 4 sütun / tablet 2x2 / mobil dikey timeline doğrulandı');
console.log('- Güvenli süreç metinleri, WhatsApp, focus ve reduced-motion doğrulandı');
console.log('- Server-side fail-closed render ve deploy zorunlulukları doğrulandı');
