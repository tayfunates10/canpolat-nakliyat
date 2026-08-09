const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'hizmetler/parca-esya-tasimaciligi.html');
const sitemapPath = path.join(root, 'sitemap.xml');
const deployPath = path.join(root, 'scripts/prepare-deploy.sh');
const failures = [];

if (!fs.existsSync(pagePath)) {
  failures.push('Parça eşya hizmet sayfası eksik.');
} else {
  const source = fs.readFileSync(pagePath, 'utf8');
  const required = [
    '<title>Edremit Parça Eşya Taşıma | Canpolat Nakliyat</title>',
    '<meta name="description" content="Edremit parça eşya taşıma hizmeti;',
    '<link rel="canonical" href="https://www.canpolatnakliyat.com/hizmetler/parca-esya-tasimaciligi.html">',
    '<meta name="robots" content="index, follow',
    '<h1>Edremit Parça Eşya Taşıma</h1>',
    '"@type": "Service"',
    '"@type": "BreadcrumbList"',
    'href="/hizmetler/parca-esya-tasimaciligi.html" aria-current="page"',
    'Camivasat Mah. Akçay Cad. No: 78',
    'href="tel:+905359120691"',
    'https://wa.me/905359120691',
    'Akçay', 'Altınoluk', 'Havran', 'İvrindi', 'Balıkesir', 'Türkiye',
  ];
  for (const token of required) if (!source.includes(token)) failures.push(`Parça eşya sayfasında zorunlu öğe eksik: ${token}`);

  const h1Count = (source.match(/<h1(?:\s|>)/g) || []).length;
  if (h1Count !== 1) failures.push(`Parça eşya sayfasında tam bir H1 olmalı, bulunan: ${h1Count}.`);

  const title = source.match(/<title>([^<]+)<\/title>/)?.[1] || '';
  if (title.length < 25 || title.length > 65) failures.push(`Parça eşya title uzunluğu uygun değil: ${title.length}.`);

  const description = source.match(/<meta name="description" content="([^"]+)"/)?.[1] || '';
  if (description.length < 110 || description.length > 165) failures.push(`Parça eşya meta description uzunluğu uygun değil: ${description.length}.`);

  const visibleWords = source
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (visibleWords < 350) failures.push(`Parça eşya hizmet içeriği yetersiz: ${visibleWords} kelime.`);

  const related = source.match(/<div class="related-grid">([\s\S]*?)<\/div>/)?.[1] || '';
  if (!related) failures.push('Parça eşya ilgili hizmetler alanı eksik.');
  if (related.includes('href="/hizmetler/parca-esya-tasimaciligi.html"')) failures.push('Parça eşya ilgili hizmetler alanı kendi sayfasına bağlanmamalı.');
}

if (!fs.existsSync(sitemapPath)) {
  failures.push('sitemap.xml eksik.');
} else {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  if (!sitemap.includes('<loc>https://www.canpolatnakliyat.com/hizmetler/parca-esya-tasimaciligi.html</loc>')) failures.push('Parça eşya URL sitemap içinde eksik.');
}

if (!fs.existsSync(deployPath)) {
  failures.push('scripts/prepare-deploy.sh eksik.');
} else {
  const deploy = fs.readFileSync(deployPath, 'utf8');
  const matches = deploy.match(/"hizmetler\/parca-esya-tasimaciligi\.html"/g) || [];
  if (matches.length < 2) failures.push('Parça eşya sayfası deploy giriş ve çıktı doğrulamasında zorunlu değil.');
}

if (failures.length) {
  console.error('Parça eşya denetimi başarısız:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PASS: Parça eşya hizmet sayfası, SEO, yerel kapsam, içerik, sitemap ve deploy paketi doğrulandı.');
