const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const phpPath = path.join(root, 'index.php');
const heroCssPath = path.join(root, 'css', 'hero-animated.css');
const heroJsPath = path.join(root, 'js', 'hero-animated.js');
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

for (const file of [phpPath, heroCssPath, heroJsPath]) {
  expect(fs.existsSync(file), `Gerekli Bölüm 01 dosyası bulunamadı: ${path.relative(root, file)}`);
}

const php = fs.existsSync(phpPath) ? fs.readFileSync(phpPath, 'utf8') : '';
const heroCss = fs.existsSync(heroCssPath) ? fs.readFileSync(heroCssPath, 'utf8') : '';
const heroJs = fs.existsSync(heroJsPath) ? fs.readFileSync(heroJsPath, 'utf8') : '';

expect(php.includes("'Canpolat Nakliyat olarak eşyalarınızı özenle taşıyor, zamanında ve güvenli hizmet sunuyoruz.'"), 'Hero açıklaması için legacy kaynak eşleşmesi eksik.');
expect(php.includes("'Canpolat Nakliyat olarak eşyalarınızı özenle taşıyor, süreci planlı ve düzenli şekilde yürütüyoruz.'"), 'Hero açıklamasının yeni güvenli metni eksik.');
expect(php.includes('Özenli</span> <span class="trust-item__l2">Taşıma'), 'Hero güven unsuru “Özenli Taşıma” dönüşümü eksik.');
expect(php.includes('Planlı</span> <span class="trust-item__l2">Süreç'), 'Hero güven unsuru “Planlı Süreç” dönüşümü eksik.');
expect(php.includes("str_replace('<em>Hızlı Servis</em>', '<em>Yerel Hizmet</em>'"), 'Hero rozet “Yerel Hizmet” dönüşümü eksik.');

const layerCount = (php.match(/<img class=\"hero-r8__layer\s+hero-r8__layer--[a-z0-9]+\"/g) || []).length;
expect(layerCount === 13, `Hero R8 katman sayısı değişmiş: ${layerCount}, beklenen 13.`);
expect(php.includes('platform-p00-r8-reference-exact.png'), 'P00 platform katmanı production renderer içinde yok.');
expect(php.includes('truck-t00-r6.png'), 'T00 kamyon katmanı production renderer içinde yok.');
expect(heroCss.includes('P00 → L09 → T00 → L01 → L02 → L04 → L03 → L05 → L06 → L10 → L11 → L07 → L08'), 'R8 Z sırası CSS kilidi bulunamadı.');
expect(heroCss.includes('@media (prefers-reduced-motion: reduce)'), 'Hero reduced-motion CSS desteği eksik.');
expect(heroJs.includes("layers.length !== 13"), 'Hero JS 13 katman fail-closed denetimi eksik.');
expect(heroJs.includes("stage.classList.add('is-ready')"), 'Hero JS is-ready akışı eksik.');

if (failures.length) {
  console.error('BÖLÜM 01 STATIC AUDIT FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('BÖLÜM 01 STATIC AUDIT PASS');
console.log('- Hero güvenli içerik dönüşümleri doğrulandı');
console.log('- R8 katman sayısı ve Z sırası korunuyor');
console.log('- Reduced-motion ve JS fail-closed altyapısı korunuyor');
