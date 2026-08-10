const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'js/script.js'), 'utf8');
const failures = [];

const regions = [
  ['Edremit Nakliyat', '/bolgeler/edremit-nakliyat.html'],
  ['Akçay Nakliyat', '/bolgeler/akcay-nakliyat.html'],
  ['Güre Nakliyat', '/bolgeler/gure-nakliyat.html'],
  ['Altınoluk Nakliyat', '/bolgeler/altinoluk-nakliyat.html'],
  ['Küçükkuyu Nakliyat', '/bolgeler/kucukkuyu-nakliyat.html'],
  ['Havran Nakliyat', '/bolgeler/havran-nakliyat.html'],
  ['İvrindi Nakliyat', '/bolgeler/ivrindi-nakliyat.html'],
  ['Burhaniye Nakliyat', '/bolgeler/burhaniye-nakliyat.html'],
  ['Gömeç Nakliyat', '/bolgeler/gomec-nakliyat.html'],
  ['Ayvalık Nakliyat', '/bolgeler/ayvalik-nakliyat.html'],
];

for (const [label, href] of regions) {
  if (!script.includes(`['${label}', '${href}']`)) failures.push(`Footer bölge bağlantısı eksik: ${label} -> ${href}`);
  const target = path.join(root, href.replace(/^\//, ''));
  if (!fs.existsSync(target)) failures.push(`Footer hedef dosyası eksik: ${href}`);
}

for (const token of [
  "document.querySelector('.site-footer')",
  "footer.querySelector('[data-footer-regions]')",
  "title.textContent = 'Hizmet Bölgeleri'",
  "nav.setAttribute('aria-label', 'Footer hizmet bölgeleri')",
  "nav.setAttribute('data-footer-regions', '')",
  'corporateColumn.appendChild(title)',
  'corporateColumn.appendChild(nav)',
]) {
  if (!script.includes(token)) failures.push(`Footer enjeksiyon kuralı eksik: ${token}`);
}

if (failures.length) {
  console.error(`Footer hizmet bölgesi denetimi başarısız (${failures.length}):`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`PASS: Footerda Edremit + ${regions.length - 1} hizmet bölgesi bağlantısı doğrulandı.`);
