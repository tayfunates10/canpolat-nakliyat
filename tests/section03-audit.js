const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const svgPath = path.join(root, 'assets/images/about-canpolat-generated.svg');
const htaccessPath = path.join(root, '.htaccess');
const templatePath = path.join(root, 'index-template.html');
const failures = [];

function fail(message) {
  failures.push(message);
}

if (!fs.existsSync(svgPath)) {
  fail('Üretilen Hakkımızda SVG asseti eksik.');
} else {
  const svg = fs.readFileSync(svgPath, 'utf8');
  if (!svg.includes('viewBox="0 0 1024 640"')) fail('Hakkımızda SVG 1024x640 viewBox kullanmıyor.');
  if (!svg.includes('#253349') || !svg.includes('#EF7C00')) fail('Hakkımızda SVG kilitli marka renklerini kullanmıyor.');
  if (!svg.includes('EDREMİT')) fail('Hakkımızda SVG Edremit yerel bağlamını taşımıyor.');
  if (!svg.includes('Paketli koltuk') && !svg.includes('paketli koltuk')) fail('Hakkımızda SVG taşınma sahnesi açıklaması eksik.');
  if (/<script\b/i.test(svg)) fail('Hakkımızda SVG script içeremez.');
  if (/<foreignObject\b/i.test(svg)) fail('Hakkımızda SVG foreignObject içeremez.');
  if (/\b(?:https?:)?\/\//i.test(svg.replace('http://www.w3.org/2000/svg', ''))) fail('Hakkımızda SVG harici kaynak çağıramaz.');
}

if (!fs.existsSync(htaccessPath)) {
  fail('.htaccess eksik.');
} else {
  const htaccess = fs.readFileSync(htaccessPath, 'utf8');
  const rewrite = 'RewriteRule ^assets/images/about-canpolat\\.webp$ assets/images/about-canpolat-generated.svg [L,NC]';
  if (!htaccess.includes(rewrite)) fail('Eksik about-canpolat.webp isteğini SVG assetine bağlayan production rewrite eksik.');
}

if (fs.existsSync(path.join(root, 'assets/images/about-canpolat.webp'))) {
  fail('Eski about-canpolat.webp binary dosyası beklenmiyor; tek kaynak üretilen SVG olmalı.');
}

if (!fs.existsSync(templatePath)) {
  fail('index-template.html eksik.');
} else {
  const template = fs.readFileSync(templatePath, 'utf8');
  if (!template.includes('src="assets/images/about-canpolat.webp"')) {
    fail('Hakkımızda bölümü production rewrite ile eşleşen about-canpolat.webp isteğini taşımıyor.');
  }
}

if (failures.length) {
  console.error('BÖLÜM 03 STATIC AUDIT FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('BÖLÜM 03 STATIC AUDIT PASS');
console.log('- Üretilen Hakkımızda SVG güvenli ve self-contained');
console.log('- #253349 / #EF7C00 marka renkleri doğrulandı');
console.log('- about-canpolat.webp production rewrite ile yeni assete bağlandı');
console.log('- Eski eksik WebP binary dosyası repoda bulunmuyor');
