const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];
const pages = [
  'bolgeler/akcay-nakliyat.html',
  'bolgeler/altinoluk-nakliyat.html',
];

function read(relative) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) {
    failures.push(`Eksik dosya: ${relative}`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
}

function requireToken(relative, source, token, message) {
  if (!source.includes(token)) failures.push(`${relative}: ${message}`);
}

const titles = new Set();
const visibleFingerprints = new Set();

for (const relative of pages) {
  const source = read(relative);
  const canonical = `https://www.canpolatnakliyat.com/${relative}`;

  for (const token of [
    '<html lang="tr">',
    '<meta name="theme-color" content="#253349">',
    '<meta name="robots" content="index, follow',
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:url" content="${canonical}">`,
    'href="/css/style.css?v=20260810-20"',
    'id="ana-icerik"',
    '<nav class="breadcrumb container"',
    '"@type": "MovingCompany"',
    '"@type": "Service"',
    '"@type": "BreadcrumbList"',
    'href="tel:+905359120691"',
    'https://wa.me/905359120691',
    'Edremit / Balıkesir',
  ]) requireToken(relative, source, token, `zorunlu SEO/üretim öğesi eksik: ${token}`);

  if (/Camivasat|Ak%C3%A7ay|"streetAddress"|openingHoursSpecification|info@canpolatnakliyat\.com|mailto:/i.test(source)) {
    failures.push(`${relative}: production'da kaldırılmış açık adres/saat/e-posta bilgisi geri eklenmemelidir.`);
  }
  if (/canpolatevdenevenakliyat\.com/i.test(source)) {
    failures.push(`${relative}: kapsam dışı eski alan adına referans bulunmamalıdır.`);
  }

  const mapLinks = (source.match(/href="https:\/\/maps\.app\.goo\.gl\/soogyt8uA8WxuFEM8"/g) || []).length;
  if (mapLinks !== 2) failures.push(`${relative}: masaüstü ve mobil için tam 2 Google Haritalar bağlantısı bekleniyor, bulunan ${mapLinks}.`);

  const title = source.match(/<title>([^<]+)<\/title>/)?.[1] || '';
  if (title.length < 25 || title.length > 65) failures.push(`${relative}: title 25-65 karakter olmalıdır.`);
  if (titles.has(title)) failures.push(`${relative}: title benzersiz değildir: ${title}`);
  titles.add(title);

  const description = source.match(/<meta name="description" content="([^"]+)"/)?.[1] || '';
  if (description.length < 110 || description.length > 165) failures.push(`${relative}: meta description 110-165 karakter olmalıdır.`);

  const h1Count = (source.match(/<h1(?:\s|>)/g) || []).length;
  if (h1Count !== 1) failures.push(`${relative}: tam 1 H1 olmalıdır, bulunan ${h1Count}.`);

  const text = source
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = text ? text.split(' ').length : 0;
  if (words < 350) failures.push(`${relative}: yerel içerik yetersiz, en az 350 kelime bekleniyor; bulunan ${words}.`);

  const prose = source.match(/<article class="prose">([\s\S]*?)<\/article>/)?.[1] || '';
  const fingerprint = prose.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 260);
  if (!fingerprint) failures.push(`${relative}: özgün ana içerik alanı bulunamadı.`);
  if (visibleFingerprints.has(fingerprint)) failures.push(`${relative}: başka bir bölge sayfasıyla kopya başlangıç içeriği tespit edildi.`);
  visibleFingerprints.add(fingerprint);

  for (const match of source.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(match[0])) failures.push(`${relative}: yeni sekme bağlantısında noopener eksik.`);
  }
  for (const match of source.matchAll(/<img\b[^>]*>/g)) {
    if (!/\bwidth="\d+"/.test(match[0]) || !/\bheight="\d+"/.test(match[0])) failures.push(`${relative}: görsel width/height eksik.`);
  }

  const localRefs = [...source.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)].map(match => match[1]);
  for (const reference of localRefs) {
    if (reference === '/') continue;
    const target = path.join(root, reference.replace(/^\//, ''));
    if (!fs.existsSync(target)) failures.push(`${relative}: kırık yerel bağlantı: ${reference}`);
  }

  for (const match of source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      failures.push(`${relative}: JSON-LD geçersiz: ${error.message}`);
    }
  }
}

const sitemap = read('sitemap.xml');
for (const relative of pages) {
  const url = `https://www.canpolatnakliyat.com/${relative}`;
  requireToken('sitemap.xml', sitemap, `<loc>${url}</loc>`, `${relative} sitemap'te bulunmuyor.`);
}

if (failures.length) {
  console.error(`Yerel SEO denetimi başarısız (${failures.length}):`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`PASS: ${pages.length} yerel SEO sayfası canonical, içerik, schema, bağlantı ve sitemap kontrollerinden geçti.`);
