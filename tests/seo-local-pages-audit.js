const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pages = [
  'bolgeler/akcay-nakliyat.html',
  'bolgeler/altinoluk-nakliyat.html',
  'bolgeler/ayvalik-nakliyat.html',
  'bolgeler/burhaniye-nakliyat.html',
  'bolgeler/havran-nakliyat.html',
  'bolgeler/ivrindi-nakliyat.html',
  'bolgeler/kucukkuyu-nakliyat.html',
  'bolgeler/gure-nakliyat.html',
  'bolgeler/gomec-nakliyat.html',
];
const failures = [];
const titles = new Set();
const canonicals = new Set();

function read(relative) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) { failures.push(`Eksik dosya: ${relative}`); return ''; }
  return fs.readFileSync(file, 'utf8');
}

for (const relative of pages) {
  const source = read(relative);
  const canonical = `https://www.canpolatnakliyat.com/${relative}`;
  const required = [
    '<html lang="tr">', '<meta name="theme-color" content="#253349">',
    '<meta name="robots" content="index, follow', `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:url" content="${canonical}">`, 'href="/css/style.css?v=20260810-20"',
    'id="ana-icerik"', '<nav class="breadcrumb container"',
    'BreadcrumbList', 'href="tel:+905359120691"', 'https://wa.me/905359120691', 'Edremit / Balıkesir'
  ];
  for (const token of required) if (!source.includes(token)) failures.push(`${relative}: zorunlu öğe eksik: ${token}`);
  if (!/"@type"\s*:\s*"Service"/.test(source)) failures.push(`${relative}: Service JSON-LD eksik.`);

  if (/Camivasat|"streetAddress"|openingHoursSpecification|info@canpolatnakliyat\.com|mailto:/i.test(source)) failures.push(`${relative}: kaldırılmış açık adres/saat/e-posta bilgisi geri eklenmiş.`);
  if (/canpolatevdenevenakliyat\.com/i.test(source)) failures.push(`${relative}: kapsam dışı eski alan adına referans var.`);

  const mapLinks = (source.match(/href="https:\/\/maps\.app\.goo\.gl\/soogyt8uA8WxuFEM8"/g) || []).length;
  if (mapLinks !== 2) failures.push(`${relative}: tam 2 Google Haritalar bağlantısı bekleniyor; bulunan ${mapLinks}.`);

  const title = source.match(/<title>([^<]+)<\/title>/)?.[1] || '';
  if (title.length < 25 || title.length > 65) failures.push(`${relative}: title 25-65 karakter olmalı.`);
  if (titles.has(title)) failures.push(`${relative}: title benzersiz değil.`);
  titles.add(title);

  const canonicalMatch = source.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || '';
  if (canonicals.has(canonicalMatch)) failures.push(`${relative}: canonical benzersiz değil.`);
  canonicals.add(canonicalMatch);

  const description = source.match(/<meta name="description" content="([^"]+)"/)?.[1] || '';
  if (description.length < 110 || description.length > 165) failures.push(`${relative}: description 110-165 karakter olmalı.`);
  if ((source.match(/<h1(?:\s|>)/g) || []).length !== 1) failures.push(`${relative}: tam 1 H1 olmalı.`);

  const visible = source.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
  if (visible.split(' ').length < 350) failures.push(`${relative}: yerel içerik 350 kelimenin altında.`);

  for (const match of source.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(match[0])) failures.push(`${relative}: target=_blank bağlantısında noopener eksik.`);
  for (const match of source.matchAll(/<img\b[^>]*>/g)) if (!/width="\d+"/.test(match[0]) || !/height="\d+"/.test(match[0])) failures.push(`${relative}: görsel ölçüleri eksik.`);

  for (const ref of [...source.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)].map(m => m[1])) {
    if (ref !== '/' && !fs.existsSync(path.join(root, ref.replace(/^\//, '')))) failures.push(`${relative}: kırık yerel bağlantı: ${ref}`);
  }
  for (const match of source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch (error) { failures.push(`${relative}: JSON-LD geçersiz: ${error.message}`); }
  }
}

const sitemap = read('sitemap.xml');
const deployScript = read('scripts/prepare-deploy.sh');
for (const relative of pages) {
  if (!sitemap.includes(`<loc>https://www.canpolatnakliyat.com/${relative}</loc>`)) failures.push(`sitemap.xml: ${relative} eksik.`);
  if (!deployScript.includes(`"${relative}"`)) failures.push(`scripts/prepare-deploy.sh: ${relative} local_seo_pages listesinde bulunmalı.`);
}
if (!deployScript.includes('"${local_seo_pages[@]}"')) failures.push('scripts/prepare-deploy.sh: local_seo_pages listesi deploy doğrulamasına bağlanmamış.');
const localListUses = deployScript.split('"${local_seo_pages[@]}"').length - 1;
if (localListUses < 2) failures.push('scripts/prepare-deploy.sh: local_seo_pages hem kaynak hem çıktı doğrulamasında kullanılmalı.');

if (failures.length) {
  console.error(`Yerel SEO denetimi başarısız (${failures.length}):`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
console.log(`PASS: ${pages.length} yerel SEO sayfası denetimden geçti.`);
