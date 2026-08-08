#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.resolve(__dirname, '..');
const HOST = '127.0.0.1';

const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=UTF-8'],
  ['.html', 'text/html; charset=UTF-8'],
  ['.js', 'application/javascript; charset=UTF-8'],
  ['.json', 'application/json; charset=UTF-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webmanifest', 'application/manifest+json; charset=UTF-8'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=UTF-8'],
]);

const DENIED_PREFIXES = ['/tests/', '/scripts/', '/tools/', '/source-assets/'];
const LEGACY_HERO = /^\/assets\/images\/hero-canpolat(?:-mobil)?\.webp$/i;

function securityHeaders() {
  return {
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
  };
}

function safePathname(rawUrl) {
  try {
    return decodeURIComponent(new URL(rawUrl, 'http://localhost').pathname);
  } catch {
    return null;
  }
}

function resolveRequest(rawUrl) {
  const pathname = safePathname(rawUrl);
  if (!pathname || pathname.includes('\0')) return { status: 400 };
  if (pathname === '/index.php' || pathname === '/index.html') return { status: 301, location: '/' };
  if (pathname === '/index-template.html' || DENIED_PREFIXES.some(prefix => pathname.startsWith(prefix))) return { status: 403 };
  if (LEGACY_HERO.test(pathname)) return { status: 410 };

  if (pathname === '/') return { status: 200, file: path.join(ROOT, 'index-template.html') };

  const candidate = path.resolve(ROOT, `.${pathname}`);
  if (candidate !== ROOT && !candidate.startsWith(`${ROOT}${path.sep}`)) return { status: 400 };

  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    if (!pathname.endsWith('/')) return { status: 301, location: `${pathname}/` };
    const indexFile = path.join(candidate, 'index.html');
    if (fs.existsSync(indexFile)) return { status: 200, file: indexFile };
  }
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return { status: 200, file: candidate };
  return { status: 404, file: path.join(ROOT, '404.html') };
}

function createPreviewServer() {
  return http.createServer((request, response) => {
    const result = resolveRequest(request.url || '/');
    const headers = securityHeaders();

    if (result.location) {
      response.writeHead(result.status, { ...headers, Location: result.location, 'Cache-Control': 'no-store' });
      response.end();
      return;
    }

    if (!result.file) {
      response.writeHead(result.status, { ...headers, 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'no-store' });
      response.end(result.status === 410 ? 'Gone' : result.status === 403 ? 'Forbidden' : 'Bad Request');
      return;
    }

    const extension = path.extname(result.file).toLowerCase();
    const immutable = /\.(?:css|js|png|svg|webp|woff2)$/i.test(result.file);
    const compressible = /\.(?:css|html|js|json|svg|webmanifest|xml)$/i.test(result.file);
    const acceptsGzip = /\bgzip\b/i.test(request.headers['accept-encoding'] || '');
    const fileHeaders = {
      ...headers,
      'Content-Type': MIME_TYPES.get(extension) || 'application/octet-stream',
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache, must-revalidate, max-age=0',
    };
    if (compressible && acceptsGzip) {
      fileHeaders['Content-Encoding'] = 'gzip';
      fileHeaders.Vary = 'Accept-Encoding';
    }
    if (result.file.endsWith('index-template.html')) fileHeaders['X-Hero-Version'] = 'R8-SEO-01';

    response.writeHead(result.status, fileHeaders);
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    const stream = fs.createReadStream(result.file);
    if (compressible && acceptsGzip) stream.pipe(zlib.createGzip({ level: 6 })).pipe(response);
    else stream.pipe(response);
  });
}

function parsePort(argv) {
  const flagIndex = argv.indexOf('--port');
  const raw = flagIndex >= 0 ? argv[flagIndex + 1] : process.env.CP_PREVIEW_PORT || '8099';
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`Geçersiz preview portu: ${raw}`);
  return port;
}

if (require.main === module) {
  const port = parsePort(process.argv.slice(2));
  createPreviewServer().listen(port, HOST, function () {
    const address = this.address();
    console.log(`Canpolat production preview: http://${HOST}:${address.port}`);
  });
}

module.exports = { createPreviewServer, resolveRequest };
