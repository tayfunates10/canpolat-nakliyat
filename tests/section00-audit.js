const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cssPath = path.join(root, 'css', 'section-00.css');
const phpPath = path.join(root, 'index.php');
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(fs.existsSync(cssPath), 'css/section-00.css bulunamadı.');
expect(fs.existsSync(phpPath), 'index.php bulunamadı.');

const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
const php = fs.existsSync(phpPath) ? fs.readFileSync(phpPath, 'utf8') : '';

expect(css.includes('--color-bg: #253349;'), 'Onaylı ana lacivert #253349 uygulanmamış.');
expect(css.includes('--color-orange: #ef7c00;'), 'Onaylı ana turuncu #EF7C00 uygulanmamış.');
expect(css.includes('min-width: 44px;') && css.includes('min-height: 44px;'), '44x44 dokunma hedefi koruması eksik.');
expect(css.includes('main section[id]'), 'Sticky header anchor scroll-margin kuralı eksik.');
expect(css.includes('@media (prefers-reduced-motion: reduce)'), 'Reduced-motion Bölüm 00 koruması eksik.');

expect(php.includes('css/section-00.css?v=20260808-01'), 'Bölüm 00 stil katmanı production renderer tarafından yüklenmiyor.');
expect(php.includes("str_replace('7/24 Bizi Arayın', 'Bizi Arayın'"), 'Doğrulanmamış 7/24 ifadesi production çıktısından kaldırılmıyor.');
expect(php.includes('content=\"#253349\"'), 'Theme color #253349 olarak güncellenmiyor.');

const heroLayerCount = (php.match(/<img class=\"hero-r8__layer\s+hero-r8__layer--[a-z0-9]+\"/g) || []).length;
expect(heroLayerCount === 13, `Hero R8 katman sayısı değişmiş: ${heroLayerCount}, beklenen 13.`);
expect(!php.includes('hero-position-fix.css'), 'Eski hero-position-fix.css yeniden eklenmiş.');

for (const forbidden of ['git reset --hard', 'dangerous-clean-slate: true']) {
  expect(!css.includes(forbidden) && !php.includes(forbidden), `Bölüm 00 dosyalarında yasaklı ifade bulundu: ${forbidden}`);
}

if (failures.length) {
  console.error('BÖLÜM 00 AUDIT FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('BÖLÜM 00 AUDIT PASS');
console.log('- Marka renkleri doğrulandı: #253349 / #EF7C00');
console.log('- Header dokunma hedefleri ve anchor offset koruması doğrulandı');
console.log('- 7/24 iddiasının runtime kaldırılması doğrulandı');
console.log('- Hero R8 13 katman kilidi korunuyor');
