'use strict';

const assert = require('node:assert/strict');
const { createPreviewServer } = require('../scripts/preview-server');
const { generatedPages } = require('../scripts/generate-seo-pages');

async function request(base, pathname, options = {}) {
  return fetch(`${base}${pathname}`, { redirect: 'manual', ...options });
}

async function run() {
  const server = createPreviewServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const address = server.address();
    const base = `http://127.0.0.1:${address.port}`;
    const indexableRoutes = ['/', ...generatedPages.filter(page => !String(page.robots || '').includes('noindex')).map(page => page.url)];

    for (const route of indexableRoutes) {
      const response = await request(base, route);
      assert.equal(response.status, 200, `${route} HTTP 200 dönmeli`);
      assert.match(response.headers.get('content-type') || '', /^text\/html/, `${route} HTML olmalı`);
      const html = await response.text();
      assert.match(html, /<html lang="tr">/, `${route} Türkçe belge olmalı`);
      assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/i, `${route} indexlenebilir olmalı`);
    }

    for (const route of ['/index.html', '/index.php']) {
      const response = await request(base, route);
      assert.equal(response.status, 301, `${route} 301 dönmeli`);
      assert.equal(response.headers.get('location'), '/', `${route} canonical köke yönlenmeli`);
    }

    const directoryRedirect = await request(base, '/hizmetler');
    assert.equal(directoryRedirect.status, 301);
    assert.equal(directoryRedirect.headers.get('location'), '/hizmetler/');

    const notFound = await request(base, '/olmayan-sayfa');
    assert.equal(notFound.status, 404, 'Özel 404 gerçek 404 koduyla sunulmalı');
    assert.match(await notFound.text(), /<meta name="robots" content="noindex, follow">/);

    const gone = await request(base, '/assets/images/hero-canpolat.webp');
    assert.equal(gone.status, 410, 'Emekli hero URL’si 410 dönmeli');

    const privateTemplate = await request(base, '/index-template.html');
    assert.equal(privateTemplate.status, 403, 'Kaynak şablon doğrudan sunulmamalı');

    const sitemap = await request(base, '/sitemap.xml');
    assert.equal(sitemap.status, 200);
    assert.match(sitemap.headers.get('content-type') || '', /^application\/xml/);

    const head = await request(base, '/', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('x-hero-version'), 'R8-SEO-01');
    assert.match(head.headers.get('content-security-policy') || '', /default-src 'self'/);

    console.log(`${indexableRoutes.length} indekslenebilir URL HTTP 200; 301, 403, 404, 410 ve güvenlik başlıkları doğrulandı.`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
