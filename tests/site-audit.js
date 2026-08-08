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

/* --------------------------------------------------------------------------
 * HİZMET GÖRSELLERİ KİLİT DENETİMİ
 * -------------------------------------------------------------------------- */
const serviceImages = [
  ['Evden Eve Nakliyat', 'service-evden-eve', '54c73ed6c0add793e0f82ead9b32db04e92b254688957722ee315f7dd4d045dd', '151895723f7505d687ea0062b6ce1e193d2ca45e5fbefe0102f5927da524174c'],
  ['Şehirler Arası Nakliyat', 'service-sehirler-arasi', '0de65f313098052d472bea9e4f3d8cf8e51c429fdcd8618eb9e02f0275afbb49', '3b0b02ee0b45c9a25f0f2d0062aa69ad717650d4d22d1ecb26e13901af83048c'],
  ['Ofis Taşıma', 'service-ofis', 'fae21c7511609bed32a0e8a307b170a8e3e2d89819130f2e94eab60c46429ec9', 'e3261117c35fcb26cbb1dd107947f03916b304371cf8d845466e363180d951af'],
  ['Asansörlü Taşıma', 'service-asansorlu', '610960059cd339620c0245f3105350aea16f1789cf59971903f32f8b837cae27', '53158238d807769f824f6ecdaaa06de8d418457b68128f13ff7e8cec74159af8'],
  ['Paketleme & Montaj', 'service-paketleme', 'd522eee0b7978053646461ca03a2f26edb99150a7ccb2f4bc33e0513e8b3ec1b', 'fcfa4899e63f2a31fbaa91053ccf859b584dfbef1024873cf368ebe32e58c85c'],
];

for (const [label, basename, sourceHash, webpHash] of serviceImages) {
  const sourcePath = path.join(root, 'source-assets/services', `${basename}.png`);
  const webpPath = path.join(root, 'assets/images', `${basename}.webp`);

  if (!fs.existsSync(sourcePath)) {
    failures.push(`${label} kaynak PNG eksik: source-assets/services/${basename}.png`);
  } else {
    const buffer = fs.readFileSync(sourcePath);
    if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      failures.push(`${label} kaynağı geçerli PNG değil: ${basename}.png`);
    } else if (buffer.readUInt32BE(16) !== 1586 || buffer.readUInt32BE(20) !== 992) {
      failures.push(`${label} kaynak ölçüsü değişmiş: ${basename}.png`);
    }
    if (sha256(buffer) !== sourceHash) failures.push(`${label} kaynak PNG kimliği değişmiş: ${basename}.png`);
  }

  if (!fs.existsSync(webpPath)) {
    failures.push(`${label} WebP eksik: assets/images/${basename}.webp`);
  } else {
    const buffer = fs.readFileSync(webpPath);
    if (buffer.subarray(0, 4).toString('ascii') !== 'RIFF' || buffer.subarray(8, 12).toString('ascii') !== 'WEBP') {
      failures.push(`${label} çıktısı geçerli WebP değil: ${basename}.webp`);
    }
    if (sha256(buffer) !== webpHash) failures.push(`${label} lossless WebP kimliği değişmiş: ${basename}.webp`);
  }
}

for (const [id, filename, expectedHash] of heroLayers) {
  const file = path.join(heroDir, filename);
  if (!fs.existsSync(file)) {
    failures.push(`Hero R8 ${id} eksik: assets/images/hero-r8/${filename}`);
    continue;
  }

  const buffer = fs.readFileSync(file);
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
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
  if (colorType !== 6) failures.push(`Hero R8 ${id} RGBA değil: ${filename}, PNG color type=${colorType}`);
  if (sha256(buffer) !== expectedHash) failures.push(`Hero R8 ${id} dosya kimliği değişmiş: ${filename}`);
}

const indexHtmlPath = path.join(root, 'index.html');
const templatePath = path.join(root, 'index-template.html');
const indexPhpPath = path.join(root, 'index.php');
const siteCssPath = path.join(root, 'css/style.css');
const serviceCssPath = path.join(root, 'css/services-tune.css');
const heroCssPath = path.join(root, 'css/hero-animated.css');
const heroJsPath = path.join(root, 'js/hero-animated.js');
const deployPath = path.join(root, 'scripts/prepare-deploy.sh');
const htaccessPath = path.join(root, '.htaccess');

for (const required of [indexHtmlPath, templatePath, indexPhpPath, siteCssPath, serviceCssPath, heroCssPath, heroJsPath, deployPath, htaccessPath]) {
  if (!fs.existsSync(required)) failures.push(`Hero R8 altyapı dosyası eksik: ${path.relative(root, required)}`);
}

/* Eski hero binary dosyaları repoda bulunamaz. */
for (const legacy of ['hero-canpolat.webp', 'hero-canpolat-mobil.webp']) {
  if (fs.existsSync(path.join(root, 'assets/images', legacy))) {
    failures.push(`Eski hero dosyası repoda bulunmamalı: assets/images/${legacy}`);
  }
}

/* Public index.html yalnız güvenli yönlendirme stub'ıdır; eski hero markup'ı taşıyamaz. */
if (fs.existsSync(indexHtmlPath)) {
  const source = fs.readFileSync(indexHtmlPath, 'utf8');
  if (!source.includes("window.location.replace('/index.php')")) failures.push('Public index.html /index.php yönlendirmesi eksik.');
  for (const legacyToken of ['hero__picture', 'hero-canpolat.webp', 'hero-canpolat-mobil.webp', 'hero-r8__layer']) {
    if (source.includes(legacyToken)) failures.push(`Public index.html hero markup içermemeli: ${legacyToken}`);
  }
}

/* Gerçek içerik sırası private template üzerinden korunur. */
if (fs.existsSync(templatePath)) {
  const source = fs.readFileSync(templatePath, 'utf8');
  const mobileOrder = ['hero__eyebrow', 'hero__title', 'hero__text', 'hero__media', 'hero__dots', 'hero__trust', 'hero__actions'];
  let previous = -1;
  for (const className of mobileOrder) {
    const current = source.indexOf(`class="${className}`);
    if (current === -1) {
      failures.push(`index-template.html mobil Hero sırası öğesi eksik: ${className}`);
      continue;
    }
    if (current <= previous) failures.push(`index-template.html mobil Hero içerik sırası bozulmuş: ${className}`);
    previous = current;
  }

  if (!source.includes('css/services-tune.css?v=20260808-svc-03')) failures.push('index-template.html güncel hizmet CSS sürümünü yüklemiyor.');
  previous = -1;
  for (const [, basename] of serviceImages) {
    const expected = `src="assets/images/${basename}.webp?v=20260808-svc-03"`;
    const current = source.indexOf(expected);
    if (current === -1) {
      failures.push(`index-template.html hizmet görselini çağırmıyor: ${basename}.webp`);
      continue;
    }
    if (current <= previous) failures.push(`index-template.html hizmet görseli sırası bozulmuş: ${basename}.webp`);
    const tagEnd = source.indexOf('>', current);
    const imageTag = source.slice(current, tagEnd + 1);
    if (!imageTag.includes('width="1586" height="992"')) failures.push(`${basename}.webp HTML ölçüleri 1586x992 olmalıdır.`);
    previous = current;
  }
}

if (fs.existsSync(indexPhpPath)) {
  const source = fs.readFileSync(indexPhpPath, 'utf8');
  if (!source.includes("__DIR__ . '/index-template.html'")) failures.push('index.php private index-template.html kullanmalıdır.');
  if ((source.match(/<img class="hero-r8__layer\s+hero-r8__layer--[a-z0-9]+"/g) || []).length !== 13) failures.push('index.php içinde tam 13 Hero R8 katmanı bulunmalıdır.');
  if (source.includes('hero-position-fix.css')) failures.push('index.php eski hero-position-fix.css dosyasını yüklememelidir.');
  if (source.includes('class="hero-r8__fallback"')) failures.push('index.php içinde eski hero fallback markup bulunmamalıdır.');
  if (!source.includes('$heroReplaceCount !== 1')) failures.push('index.php Hero R8 fail-closed koruması eksik.');
  if (!source.includes("header('X-LiteSpeed-Purge: *')")) failures.push('index.php LiteSpeed eski cache purge koruması eksik.');

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
  if (!/\.hero__inner\s*\{[^}]*grid-template-columns:\s*40fr\s+60fr\s*;/s.test(css)) failures.push('Masaüstü Hero 40/60 metin-sahne oranı değişmiş.');
  if (!/@media\s*\(max-width:\s*767px\)[\s\S]*?\.hero__inner\s*\{\s*display:\s*block\s*;\s*\}/.test(css)) failures.push('Mobil Hero alt alta düzen kuralı eksik.');
  if (!/\.services__grid\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*1fr\)/s.test(css)) failures.push('Masaüstü hizmetler 5 kart sütunu kuralı eksik.');
}

if (fs.existsSync(serviceCssPath)) {
  const css = fs.readFileSync(serviceCssPath, 'utf8');
  if (!css.includes('aspect-ratio: 793 / 496')) failures.push('Hizmet görsellerinin 1586x992 oranı CSS içinde korunmuyor.');
  if (!css.includes('object-fit: contain')) failures.push('Hizmet görsellerinin kırpılmama kuralı eksik.');
  if (!/@media\s*\(max-width:\s*991px\)\s*and\s*\(min-width:\s*768px\)[\s\S]*?\.services__grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(css)) failures.push('Tablet hizmetler 3 sütun kuralı eksik.');
  if (!/@media\s*\(max-width:\s*767px\)[\s\S]*?\.services__grid\s*\{[^}]*grid-template-columns:\s*1fr/.test(css)) failures.push('Mobil hizmetler tek sütun kuralı eksik.');
}

if (fs.existsSync(heroCssPath)) {
  const css = fs.readFileSync(heroCssPath, 'utf8');
  for (const token of ['aspect-ratio: 3 / 2', '.hero-r8.is-ready .hero-r8__layer', 'translate3d(0, 0, 0) scale(1)', '@media (prefers-reduced-motion: reduce)', 'object-fit: contain']) {
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
      if (property !== 'z-index' && !property.startsWith('--hero-')) failures.push(`Hero R8 ${layer} katmanında kalıcı yerleşim özelliği yasak: ${property}`);
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
  if (!deploy.includes('"index-template.html"')) failures.push('prepare-deploy.sh index-template.html yayınlamalıdır.');
  for (const [, filename] of heroLayers) {
    if (!deploy.includes(`assets/images/hero-r8/${filename}`)) failures.push(`prepare-deploy.sh Hero R8 dosyasını zorunlu doğrulamıyor: ${filename}`);
  }
  for (const legacy of ['hero-canpolat.webp', 'hero-canpolat-mobil.webp']) {
    if (!deploy.includes(`assets/images/${legacy}`)) failures.push(`prepare-deploy.sh eski hero temizliğini zorunlu uygulamıyor: ${legacy}`);
  }
  for (const [, basename] of serviceImages) {
    if (!deploy.includes(`assets/images/${basename}.webp`)) failures.push(`prepare-deploy.sh hizmet görselini zorunlu doğrulamıyor: ${basename}.webp`);
  }
}

if (fs.existsSync(htaccessPath)) {
  const htaccess = fs.readFileSync(htaccessPath, 'utf8');
  if (!/^DirectoryIndex index\.php$/m.test(htaccess)) failures.push('.htaccess yalnız index.php DirectoryIndex kullanmalıdır.');
  if (!htaccess.includes('CacheDisable public /') || !htaccess.includes('CacheDisable private /')) failures.push('.htaccess LiteSpeed page cache kapatma koruması eksik.');
  if (!htaccess.includes('hero-canpolat(?:-mobil)?\\.webp')) failures.push('.htaccess eski hero URL engeli eksik.');
  if (!htaccess.includes('RewriteRule ^index\\.html$ /index.php [R=302,L,NE]')) failures.push('.htaccess doğrudan index.html → index.php yönlendirmesi eksik.');
  if (!htaccess.includes('RewriteRule ^$ index.php [L]')) failures.push('.htaccess kök → index.php internal rewrite eksik.');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`${htmlFiles.length} HTML dosyası, 5/5 kilitli hizmet görseli, public index izolasyonu, responsive Hero düzeni, cache koruması ve 13/13 kilitli Hero R8 katmanı kontrol edildi.`);
