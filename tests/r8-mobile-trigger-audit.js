const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const hero = fs.readFileSync(path.join(root, 'js/hero-animated.js'), 'utf8');
const liveJs = fs.readFileSync(path.join(root, 'js/script-live.php'), 'utf8');
const sharedCss = fs.readFileSync(path.join(root, 'css/shared-ui-final.css'), 'utf8');
const failures = [];

function requireToken(source, token, message) {
  if (!source.includes(token)) failures.push(message);
}

function forbidToken(source, token, message) {
  if (source.includes(token)) failures.push(message);
}

requireToken(hero, ".hero__facts li:nth-child(3)", 'R8 mobil tetikleyici Kurulum desteği kartını referans almalıdır.');
requireToken(hero, 'var TARGET_RATIO = 0.53;', 'R8 mobil hedef oranı 0.53 olmalıdır.');
requireToken(hero, 'anchorRect.bottom <= barTop * TARGET_RATIO', 'R8 mobil tetikleme koşulu hedef kart/sabit bar geometrisini kullanmalıdır.');
forbidToken(hero, 'copyRect.bottom <= viewportHeight * 0.22', 'Eski %22 hero-copy mobil koşulu kaldırılmış olmalıdır.');
forbidToken(hero, 'sceneMidpoint <= viewportHeight * 0.72', 'Eski %72 R8 sahne koşulu kaldırılmış olmalıdır.');
forbidToken(liveJs, "readfile(__DIR__ . '/r8-trigger-48.js')", 'Eski yardımcı R8 tetikleyici canlı JS zincirinde bulunmamalıdır.');
forbidToken(sharedCss, 'is-r8-trigger-48-lock', 'Eski R8 görünürlük kilidi canlı CSS zincirinde bulunmamalıdır.');

if (failures.length) {
  console.error('R8 mobil tetikleme denetimi başarısız:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PASS: Mobil R8 gerçek animasyonu hedef ekran geometrisine bağlı ve eski tetikleyiciler devre dışı.');
