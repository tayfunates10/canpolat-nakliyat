'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  ADDRESS,
  EMAIL,
  ORGANIZATION_ID,
  PHONE_DISPLAY,
  SITE,
  generatedPages,
  services,
} = require('../scripts/generate-seo-pages');

const ROOT = path.resolve(__dirname, '..');
const HOME = { output: 'index-template.html', url: '/' };
const indexablePages = [HOME, ...generatedPages.filter(page => !String(page.robots || '').includes('noindex'))];
const noindexFiles = ['index.html', '404.html', 'gizlilik.html'];
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function firstMatch(source, regex) {
  const match = source.match(regex);
  return match ? match[1].trim() : '';
}

function attrValue(source, element, attribute, selectorAttribute, selectorValue) {
  const tags = source.match(new RegExp(`<${element}\\b[^>]*>`, 'gi')) || [];
  for (const tag of tags) {
    const selector = firstMatch(tag, new RegExp(`\\b${selectorAttribute}=["']([^"']+)["']`, 'i'));
    if (selector !== selectorValue) continue;
    return firstMatch(tag, new RegExp(`\\b${attribute}=["']([^"']+)["']`, 'i'));
  }
  return '';
}

function jsonLd(source, label) {
  const scripts = [...source.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const parsed = [];
  scripts.forEach((match, index) => {
    try {
      parsed.push(JSON.parse(match[1]));
    } catch (error) {
      fail(`${label} JSON-LD ${index + 1} parse edilemiyor: ${error.message}`);
    }
  });
  return parsed;
}

function graphNodes(documents) {
  return documents.flatMap(document => Array.isArray(document['@graph']) ? document['@graph'] : [document]);
}

function localFileForUrl(url, sourceFile) {
  const cleaned = url.split('#')[0].split('?')[0];
  if (!cleaned) return null;
  if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(cleaned) || cleaned.startsWith('//')) return null;
  if (cleaned === '/') return path.join(ROOT, 'index-template.html');
  if (cleaned.startsWith('/')) {
    const absolute = path.join(ROOT, cleaned.slice(1));
    return cleaned.endsWith('/') ? path.join(absolute, 'index.html') : absolute;
  }
  const absolute = path.resolve(path.dirname(path.join(ROOT, sourceFile)), cleaned);
  return cleaned.endsWith('/') ? path.join(absolute, 'index.html') : absolute;
}

function verifyResources(source, page) {
  const attributes = [...source.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)].map(match => match[1]);
  const srcsetItems = [...source.matchAll(/\bsrcset=["']([^"']+)["']/gi)]
    .flatMap(match => match[1].split(',').map(item => item.trim().split(/\s+/)[0]));

  for (const url of [...attributes, ...srcsetItems]) {
    if (url === '#') fail(`${page.output} boş # bağlantısı içeriyor.`);
    const target = localFileForUrl(url, page.output);
    if (target && !fs.existsSync(target)) fail(`${page.output} kırık yerel kaynak/bağlantı: ${url}`);
  }

  for (const match of source.matchAll(/<a\b[^>]*href=["']#([^"']+)["'][^>]*>/gi)) {
    if (!new RegExp(`\\bid=["']${match[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(source)) {
      fail(`${page.output} bulunmayan hash hedefi: #${match[1]}`);
    }
  }
}

const titles = new Map();
const descriptions = new Map();
const sitemapUrls = new Set([...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]));
const expectedSitemapUrls = new Set(indexablePages.map(page => `${SITE}${page.url}`));

for (const page of indexablePages) {
  const source = read(page.output);
  const canonical = `${SITE}${page.url}`;
  const title = firstMatch(source, /<title>([^<]+)<\/title>/i);
  const description = attrValue(source, 'meta', 'content', 'name', 'description');
  const robots = attrValue(source, 'meta', 'content', 'name', 'robots');
  const canonicalFound = attrValue(source, 'link', 'href', 'rel', 'canonical');
  const h1Count = (source.match(/<h1\b/gi) || []).length;
  const h1Text = firstMatch(source, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  if (!/<html lang="tr">/i.test(source)) fail(`${page.output} lang=tr eksik.`);
  if (!attrValue(source, 'meta', 'content', 'name', 'viewport')) fail(`${page.output} viewport eksik.`);
  if (!title) fail(`${page.output} title eksik.`);
  if (!description) fail(`${page.output} meta description eksik.`);
  if (titles.has(title)) fail(`${page.output} yinelenen title: ${title} (${titles.get(title)})`); else titles.set(title, page.output);
  if (descriptions.has(description)) fail(`${page.output} yinelenen description: ${description} (${descriptions.get(description)})`); else descriptions.set(description, page.output);
  if (h1Count !== 1 || !h1Text) fail(`${page.output} tek ve anlamlı H1 içermeli; bulunan: ${h1Count}`);
  if (/noindex/i.test(robots)) fail(`${page.output} yanlışlıkla noindex.`);
  if (canonicalFound !== canonical) fail(`${page.output} canonical hatalı: ${canonicalFound || 'eksik'}`);
  if (attrValue(source, 'meta', 'content', 'property', 'og:url') !== canonical) fail(`${page.output} og:url canonical ile eşleşmiyor.`);
  for (const meta of ['og:title', 'og:description', 'og:image']) {
    if (!attrValue(source, 'meta', 'content', 'property', meta)) fail(`${page.output} ${meta} eksik.`);
  }
  for (const meta of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    if (!attrValue(source, 'meta', 'content', 'name', meta)) fail(`${page.output} ${meta} eksik.`);
  }
  if (!sitemapUrls.has(canonical)) fail(`${page.output} sitemap içinde yok.`);
  const visibleText = source.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const napPart of ['Canpolat Evden Eve Nakliyat', 'Camivasat Mah. Akçay Cad. No: 78', 'Edremit / Balıkesir', PHONE_DISPLAY, EMAIL]) {
    if (!visibleText.includes(napPart)) fail(`${page.output} doğrulanmış görünür NAP parçası eksik: ${napPart}`);
  }

  const documents = jsonLd(source, page.output);
  if (!documents.length) fail(`${page.output} JSON-LD içermiyor.`);
  const nodes = graphNodes(documents);
  const organization = nodes.find(node => node['@id'] === ORGANIZATION_ID);
  const webPage = nodes.find(node => node['@id'] === `${canonical}#webpage`);
  if (!organization || organization['@type'] !== 'MovingCompany') fail(`${page.output} bağlı MovingCompany nesnesi eksik.`);
  if (!webPage || webPage.url !== canonical) fail(`${page.output} WebPage nesnesi eksik veya URL hatalı.`);
  if (page.url !== '/' && !nodes.some(node => node['@type'] === 'BreadcrumbList')) fail(`${page.output} BreadcrumbList eksik.`);
  if (page.service && !nodes.some(node => node['@type'] === 'Service' && node.provider?.['@id'] === ORGANIZATION_ID)) fail(`${page.output} bağlı Service şeması eksik.`);
  if (organization) {
    if (organization.telephone !== '+905359120691' || organization.email !== EMAIL) fail(`${page.output} şema telefon/e-posta NAP uyuşmazlığı.`);
    if (organization.address?.streetAddress !== 'Camivasat Mah. Akçay Cad. No: 78') fail(`${page.output} şema adresi uyuşmuyor.`);
    const hours = JSON.stringify(organization.openingHoursSpecification || []);
    for (const token of ['Monday', '08:00', '20:00', 'Saturday', '18:00', 'Sunday', '09:00', '17:00']) {
      if (!hours.includes(token)) fail(`${page.output} şema çalışma saati eksik: ${token}`);
    }
  }
  const rawSchema = JSON.stringify(documents);
  for (const forbidden of ['aggregateRating', 'reviewCount', 'priceRange', 'foundingDate', 'sameAs', 'geo']) {
    if (rawSchema.includes(`"${forbidden}"`)) fail(`${page.output} doğrulanmamış şema alanı içeriyor: ${forbidden}`);
  }

  verifyResources(source, page);

  const images = source.match(/<img\b[^>]*>/gi) || [];
  for (const image of images) {
    if (!/\balt=["'][^"']*["']/i.test(image)) fail(`${page.output} alt niteliği eksik görsel içeriyor.`);
    if (!/\bwidth=["']\d+["']/i.test(image) || !/\bheight=["']\d+["']/i.test(image)) fail(`${page.output} ölçüsü ayrılmamış görsel içeriyor.`);
    if (!/hero-r8__layer/.test(image) && /\balt=["']["']/i.test(image)) fail(`${page.output} anlamlı görselde boş alt metni bulundu.`);
  }
  if (page.url === '/') {
    const decorativeLayers = source.match(/<img\b[^>]*hero-r8__layer[^>]*alt=""[^>]*>/gi) || [];
    if (decorativeLayers.length !== 13) fail(`Ana sayfa dekoratif Hero katmanları 13/13 boş alt olmalı; bulunan: ${decorativeLayers.length}`);
    if (!/class="hero-animated hero-r8"[^>]*role="img"[^>]*aria-label=/i.test(source)) fail('Ana Hero sahnesinin tek anlamlı erişilebilir açıklaması eksik.');
  }
}

for (const url of sitemapUrls) if (!expectedSitemapUrls.has(url)) fail(`Sitemap canonical/indexlenebilir olmayan URL içeriyor: ${url}`);
for (const url of expectedSitemapUrls) if (!sitemapUrls.has(url)) fail(`Sitemap eksik URL: ${url}`);
if (sitemapUrls.size !== expectedSitemapUrls.size) fail(`Sitemap URL sayısı ${sitemapUrls.size}; beklenen ${expectedSitemapUrls.size}.`);

for (const relativePath of noindexFiles) {
  const source = read(relativePath);
  if (!/<meta name="robots" content="[^"]*noindex/i.test(source)) fail(`${relativePath} noindex olmalı.`);
  const canonical = attrValue(source, 'link', 'href', 'rel', 'canonical');
  if (relativePath !== 'index.html' && canonical && sitemapUrls.has(canonical)) fail(`${relativePath} noindex canonical URL’si sitemap içinde olmamalı.`);
}

const allPublicHtml = ['index-template.html', ...generatedPages.map(page => page.output), '404.html'];
for (const relativePath of allPublicHtml) {
  const source = read(relativePath);
  for (const forbidden of ['Altınkum Mah.', '0 535 912 06 91', 'https://canpolatnakliyat.com', 'href="#"', 'data-noop']) {
    if (source.includes(forbidden)) fail(`${relativePath} eski/uygunsuz değer içeriyor: ${forbidden}`);
  }
}

const robots = read('robots.txt');
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail('robots.txt canonical sitemap adresini göstermiyor.');
for (const page of indexablePages) {
  const pathToken = page.url === '/' ? '/' : page.url;
  const exactDisallow = new RegExp(`^Disallow: ${pathToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm');
  if (exactDisallow.test(robots)) fail(`robots.txt indekslenebilir URL’yi engelliyor: ${pathToken}`);
}

const formSource = read('index-template.html');
for (const match of formSource.matchAll(/<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"[^>]*>/gi)) {
  if (!new RegExp(`<label\\b[^>]*for=["']${match[1]}["']`, 'i').test(formSource)) fail(`Ana form etiketi eksik: ${match[1]}`);
}
for (const event of ['phone_click', 'whatsapp_click', 'quote_form_submit']) {
  if (!formSource.includes(`data-analytics-event="${event}"`)) fail(`Dönüşüm event niteliği eksik: ${event}`);
}

assert.equal(services.length, 5, 'Doğrulanmış hizmet sayısı değişmemeli');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`${indexablePages.length} indekslenebilir URL: benzersiz metadata/H1/canonical, sitemap, iç bağlantılar, görsel altları ve geçerli bağlı JSON-LD doğrulandı.`);
