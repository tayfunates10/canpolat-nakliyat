const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const htmlFiles = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!name.startsWith('.') && name !== 'node_modules') walk(full);
    } else if (name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);

const failures = [];
for (const file of htmlFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const token of ['<html lang="tr">', '<meta name="viewport"', '<title>', '<meta name="description"', 'id="main"']) {
    if (!source.includes(token)) failures.push(`${path.relative(root,file)} eksik: ${token}`);
  }
  const localLinks = [...source.matchAll(/(?:href|src)="(\/[^"#?]+)(?:[?#][^"]*)?"/g)].map(m => m[1]);
  for (const link of localLinks) {
    if (link.startsWith('//')) continue;
    let target = path.join(root, link.replace(/^\//, ''));
    if (link === '/') target = path.join(root, 'index.html');
    if (!path.extname(target)) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) failures.push(`${path.relative(root,file)} kırık bağlantı: ${link}`);
  }
}
const forbidden = ['Okur Nakliyat', 'okurnakliyatedremit.com', '0537 226 50 43'];
for (const file of htmlFiles.concat([path.join(root,'assets/css/style.css'), path.join(root,'assets/js/main.js')])) {
  const source = fs.readFileSync(file,'utf8');
  for (const item of forbidden) if (source.includes(item)) failures.push(`${path.relative(root,file)} eski marka kalıntısı: ${item}`);
}

/* --------------------------------------------------------------------------
 * HERO R8 KİLİT DENETİMİ
 * Onaylanan 1536x1024 RGBA katmanların dosya kimliği, sıra ve web mimarisi
 * yanlışlıkla değişirse production deploy başlamadan test başarısız olur.
 * -------------------------------------------------------------------------- */
const heroDir = path.join(root, 'assets/images/hero-r8');
const heroLayers = [
  ['P00', 'platform-p00-r8-reference-exact.png', '6a2218996325d954fd17e938d5f105929489952f57753967dd98f04fabdec47b'],
  ['L09', 'layer-l09-r6.png', '7c087183945ba233220473ad349b79061ce50b6efb4b46f42e01f1ec7ef82111'],
  ['T00', 'truck-t00-r6.png', '2efda3aba4ddb2b07788612c3a4e2a94bdb9b9ce92e69bbd995f19844b38aef0'],
  ['L01', 'layer-l01-r6.png', 'e5e5885eae573f43f2b83360c2709e649b384442bb2c5b2533caa6e530cbd95e'],
  ['L02', 'layer-l02-r6.png', '3c57c46a32d842ecc7db07aa42ccb596b68b31b96febf3eb6f6d59061aa4fbca'],
  ['L04', 'layer-l04-r6.png', 'a1e0fb5922a77a46c6ca31eeff9389f8d14f4795ff3845979cbbfbfda409379c'],
  ['L03', 'layer-l03-r6.png', '4655bcaa7db698f6fb24f077158d3dedc17a5bb85979e53628f1e94c5da345d8'],
  ['L05', 'layer-l05-r6.png', 'a5b7f5fa0dfcd5496eee26bf92a3d9564f6396767a2b388634eb8a54de3b4ff0'],
  ['L06', 'layer-l06-r6.png', '70688757b277b63a008ce09a924c1808a38e6adc7859f8558e0f6700ee311875'],
  ['L10', 'layer-l10-r6.png', 'a94a419d89f1fb69eda499d59fa71e73416ffc922f513d0d03f6d530adf87541'],
  ['L11', 'layer-l11-r6.png', 'fba52d10cde807a49856c6e1b9e7f3489bd26f12d79c3b28b82c75e6a3a7db30'],
  ['L07', 'layer-l07-r6.png', 'b8a08d6dd1e033c381580865d388fdeffce7b91c1100ca7527c1d89aa89fd77c'],
  ['L08', 'layer-l08-r6.png', 'd5d6c239a42eb13c06f306e7ca5b3c47c32707de26e4c9a031d3c03eaa47d5fc'],
];

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

for (const [id, filename, expectedHash] of heroLayers) {
  const file = path.join(heroDir, filename);
  if (!fs.existsSync(file)) {
    failures.push(`Hero R8 ${id} eksik: assets/images/hero-r8/${filename}`);
    continue;
  }

  const buffer = fs.readFileSync(file);
  const pngSignature = buffer.subarray(0, 8).toString('hex');
  if (pngSignature !== '89504e470d0a1a0a') {
    failures.push(`Hero R8 ${id} geçerli PNG değil: ${filename}`);
    continue;
  }

  if (buffer.length < 26) {
    failures.push(`Hero R8 ${id} PNG başlığı eksik: ${filename}`);
    continue;
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const colorType = buffer[25];
  if (width !== 1536 || height !== 1024) {
    failures.push(`Hero R8 ${id} tuval ölçüsü değişmiş: ${filename} ${width}x${height}, beklenen 1536x1024`);
  }
  if (colorType !== 6) {
    failures.push(`Hero R8 ${id} RGBA değil: ${filename}, PNG color type=${colorType}`);
  }

  const actualHash = sha256(buffer);
  if (actualHash !== expectedHash) {
    failures.push(`Hero R8 ${id} dosya kimliği değişmiş: ${filename}`);
  }
}

const indexHtmlPath = path.join(root, 'index.html');
const indexPhpPath = path.join(root, 'index.php');
const siteCssPath = path.join(root, 'css/style.css');
const heroCssPath = path.join(root, 'css/hero-animated.css');
const heroJsPath = path.join(root, 'js/hero-animated.js');
const deployPath = path.join(root, 'scripts/prepare-deploy.sh');
const htaccessPath = path.join(root, '.htaccess');

for (const required of [indexHtmlPath, indexPhpPath, siteCssPath, heroCssPath, heroJsPath, deployPath, htaccessPath]) {
  if (!fs.existsSync(required)) failures.push(`Hero R8 altyapı dosyası eksik: ${path.relative(root, required)}`);
}

/* Eski hero binary dosyaları artık repoda bulunamaz. */
for (const legacy of ['hero-canpolat.webp', 'hero-canpolat-mobil.webp']) {
  const legacyPath = path.join(root, 'assets/images', legacy);
  if (fs.existsSync(legacyPath)) failures.push(`Eski hero dosyası repoda bulunmamalı: assets/images/${legacy}`);
}

if (fs.existsSync(indexHtmlPath)) {
  const source = fs.readFileSync(indexHtmlPath, 'utf8');
  const mobileOrder = ['hero__eyebrow', 'hero__title', 'hero__text', 'hero__media', 'hero__dots', 'hero__trust', 'hero__actions'];
  let previous = -1;
  for (const className of mobileOrder) {
    const current = source.indexOf(`class="${className}`);
    if (current === -1) {
      failures.push(`index.html mobil Hero sırası öğesi eksik: ${className}`);
      continue;
    }
    if (current <= previous) failures.push(`index.html mobil Hero içerik sırası bozulmuş: ${className}`);
    previous = current;
  }
}

if (fs.existsSync(indexPhpPath)) {
  const source = fs.readFileSync(indexPhpPath, 'utf8');
  if ((source.match(/hero-r8__layer/g) || []).length !== 13) {
    failures.push('index.php içinde tam 13 Hero R8 katmanı bulunmalıdır.');
  }
  if (source.includes('hero-position-fix.css')) {
    failures.push('index.php eski hero-position-fix.css dosyasını yüklememelidir.');
  }
  if (source.includes('class="hero-r8__fallback"')) {
    failures.push('index.php içinde eski hero fallback markup bulunmamalıdır.');
  }

  let previous = -1;
  for (const [, filename] of heroLayers) {
    const current = source.indexOf(`assets/images/hero-r8/${filename}`);
    if (current === -1) {
      failures.push(`index.php Hero R8 katmanını çağırmıyor: ${filename}`);
      continue;
    }
    if (current <= previous) failures.push(`index.php Hero R8 Z/DOM sırası bozulmuş: ${filename}`);
    previous = current;
  }
}

if (fs.existsSync(siteCssPath)) {
  const css = fs.readFileSync(siteCssPath, 'utf8');
  if (!/\.hero__inner\s*\{[^}]*grid-template-columns:\s*40fr\s+60fr\s*;/s.test(css)) {
    failures.push('Masaüstü Hero 40/60 metin-sahne oranı değişmiş.');
  }
  if (!/@media\s*\(max-width:\s*767px\)[\s\S]*?\.hero__inner\s*\{\s*display:\s*block\s*;\s*\}/.test(css)) {
    failures.push('Mobil Hero alt alta düzen kuralı eksik.');
  }
}

if (fs.existsSync(heroCssPath)) {
  const css = fs.readFileSync(heroCssPath, 'utf8');
  for (const token of [
    'aspect-ratio: 3 / 2',
    '.hero-r8.is-ready .hero-r8__layer',
    'translate3d(0, 0, 0) scale(1)',
    '@media (prefers-reduced-motion: reduce)',
    'object-fit: contain',
  ]) {
    if (!css.includes(token)) failures.push(`css/hero-animated.css Hero R8 kuralı eksik: ${token}`);
  }
  if (css.includes('.hero-r8__fallback')) failures.push('css/hero-animated.css eski fallback stilini içermemelidir.');

  const expectedZ = [
    ['p00', 1], ['l09', 2], ['t00', 3], ['l01', 4], ['l02', 5], ['l04', 6], ['l03', 7],
    ['l05', 8], ['l06', 9], ['l10', 10], ['l11', 11], ['l07', 12], ['l08', 13],
  ];
  for (const [name, z] of expectedZ) {
    const pattern = new RegExp(`\\.hero-r8__layer--${name}\\s*\\{\\s*z-index:\\s*${z};\\s*\\}`);
    if (!pattern.test(css)) failures.push(`Hero R8 z-index değişmiş: ${name.toUpperCase()} beklenen ${z}`);
  }

  const layerBlockPattern = /\.hero-r8__layer--([a-z0-9]+)\s*\{([^}]*)\}/g;
  for (const match of css.matchAll(layerBlockPattern)) {
    const layer = match[1].toUpperCase();
    const declarations = match[2].split(';').map(item => item.trim()).filter(Boolean);
    for (const declaration of declarations) {
      const colon = declaration.indexOf(':');
      if (colon === -1) continue;
      const property = declaration.slice(0, colon).trim();
      if (property !== 'z-index' && !property.startsWith('--hero-')) {
        failures.push(`Hero R8 ${layer} katmanında kalıcı yerleşim özelliği yasak: ${property}`);
      }
    }
  }
}

if (fs.existsSync(heroJsPath)) {
  const js = fs.readFileSync(heroJsPath, 'utf8');
  if (!js.includes('layers.length !== 13')) failures.push('Hero R8 JS 13 katman koruması eksik.');
  if (!js.includes("stage.classList.add('is-ready')")) failures.push('Hero R8 JS is-ready son durumu eksik.');
}

if (fs.existsSync(deployPath)) {
  const deploy = fs.readFileSync(deployPath, 'utf8');
  for (const [, filename] of heroLayers) {
    if (!deploy.includes(`assets/images/hero-r8/${filename}`)) {
      failures.push(`prepare-deploy.sh Hero R8 dosyasını zorunlu doğrulamıyor: ${filename}`);
    }
  }
  for (const legacy of ['hero-canpolat.webp', 'hero-canpolat-mobil.webp']) {
    if (!deploy.includes(`assets/images/${legacy}`)) {
      failures.push(`prepare-deploy.sh eski hero temizliğini zorunlu uygulamıyor: ${legacy}`);
    }
  }
}

if (fs.existsSync(htaccessPath)) {
  const htaccess = fs.readFileSync(htaccessPath, 'utf8');
  if (!htaccess.includes('DirectoryIndex index.php index.html')) failures.push('.htaccess index.php önceliği eksik.');
  if (!htaccess.includes('hero-canpolat(?:-mobil)?\\.webp')) failures.push('.htaccess eski hero URL engeli eksik.');
  if (!htaccess.includes('RewriteRule ^index\\.html$ / [R=301,L]')) failures.push('.htaccess doğrudan index.html yönlendirmesi eksik.');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`${htmlFiles.length} HTML dosyası, responsive Hero düzeni, eski hero kaldırma koruması ve 13/13 kilitli Hero R8 katmanı kontrol edildi.`);
