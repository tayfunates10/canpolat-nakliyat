'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(repoRoot, 'assets', 'images', 'hero-r8');
const outputDir = path.join(sourceDir, 'optimized');
const widths = [640, 960, 1280];

const layers = [
  'platform-p00-r8-reference-exact',
  'truck-t00-r6',
  'layer-l01-r6',
  'layer-l02-r6',
  'layer-l03-r6',
  'layer-l04-r6',
  'layer-l05-r6',
  'layer-l06-r6',
  'layer-l07-r6',
  'layer-l08-r6',
  'layer-l09-r6',
  'layer-l10-r6',
  'layer-l11-r6',
  'layer-l12-r6'
];

function commandWorks(command, args = ['-version']) {
  const probe = spawnSync(command, args, { stdio: 'ignore' });
  return !probe.error && probe.status === 0;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: options.quiet ? 'ignore' : 'inherit'
  });
  if (result.error || result.status !== 0) {
    throw result.error || new Error(`${command} başarısız oldu (${result.status}).`);
  }
}

function ensureEncoder() {
  if (commandWorks('cwebp')) return 'cwebp';

  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log('R8 responsive üretimi: cwebp bulunamadı, GitHub runner için webp paketi kuruluyor.');
    run('sudo', ['apt-get', 'update', '-qq']);
    run('sudo', ['apt-get', 'install', '-y', '--no-install-recommends', 'webp']);
    if (commandWorks('cwebp')) return 'cwebp';
  }

  if (commandWorks('magick')) return 'magick';
  if (commandWorks('convert')) return 'convert';

  throw new Error('R8 responsive WebP üretimi için cwebp/ImageMagick bulunamadı.');
}

function createVariant(encoder, input, output, width) {
  fs.rmSync(output, { force: true });

  if (encoder === 'cwebp') {
    run('cwebp', [
      '-quiet',
      '-q', '92',
      '-alpha_q', '100',
      '-m', '6',
      '-resize', String(width), '0',
      input,
      '-o', output
    ], { quiet: true });
  } else {
    run(encoder, [
      input,
      '-auto-orient',
      '-strip',
      '-resize', `${width}x>`,
      '-quality', '92',
      '-define', 'webp:method=6',
      '-define', 'webp:alpha-quality=100',
      output
    ], { quiet: true });
  }

  const stat = fs.statSync(output);
  if (!stat.isFile() || stat.size === 0) {
    throw new Error(`R8 responsive dosyası üretilemedi: ${output}`);
  }
}

function main() {
  // Yerel geliştirme ortamını ağır bağımlılık kurmaya zorlamıyoruz. GitHub CI
  // production deploy öncesinde bu betiği çalıştırır; mevcut dosyalar varsa
  // yerelde de doğrulama/yeniden üretim yapılabilir.
  if (process.env.GITHUB_ACTIONS !== 'true' && !commandWorks('cwebp') && !commandWorks('magick') && !commandWorks('convert')) {
    console.log('R8 responsive üretimi atlandı: yerel ortamda WebP encoder yok.');
    return;
  }

  const encoder = ensureEncoder();
  fs.mkdirSync(outputDir, { recursive: true });

  let originalBytes = 0;
  let generatedBytes = 0;

  for (const stem of layers) {
    const input = path.join(sourceDir, `${stem}.png`);
    if (!fs.existsSync(input)) {
      throw new Error(`R8 kaynak katmanı eksik: ${input}`);
    }
    originalBytes += fs.statSync(input).size;

    for (const width of widths) {
      const output = path.join(outputDir, `${stem}-${width}.webp`);
      createVariant(encoder, input, output, width);
      generatedBytes += fs.statSync(output).size;
    }
  }

  console.log(`R8 responsive katmanlar hazır: ${layers.length} katman × ${widths.length} boyut (${encoder}).`);
  console.log(`Kaynak PNG toplamı: ${(originalBytes / 1024 / 1024).toFixed(2)} MiB.`);
  console.log(`Üretilen 42 WebP toplamı: ${(generatedBytes / 1024 / 1024).toFixed(2)} MiB.`);
}

main();
