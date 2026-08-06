<?php
declare(strict_types=1);

$indexFile = __DIR__ . '/index.html';
$html = @file_get_contents($indexFile);

if ($html === false) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Ana sayfa dosyası okunamadı.';
    exit;
}

$heroPicture = <<<'HTML'
<picture class="hero__picture hero__picture--final">
  <img
    class="hero__image hero__image--final"
    src="assets/images/hero-canpolat-final.webp?v=20260806-9"
    alt="Canpolat Nakliyat kamyonu, profesyonel taşıma ekibi, paketlenmiş eşyalar, koltuk ve asansörlü taşıma sistemi"
    width="1024"
    height="576"
    fetchpriority="high"
    decoding="async">
</picture>
HTML;

$replacedHtml = preg_replace(
    '~<picture class="hero__picture">.*?</picture>~s',
    $heroPicture,
    $html,
    1
);

if (is_string($replacedHtml)) {
    $html = $replacedHtml;
}

$withoutBadge = preg_replace(
    '~\s*<!-- Lokasyon rozeti -->\s*<div class="hero__badge"[^>]*>.*?</div>~s',
    '',
    $html,
    1
);

if (is_string($withoutBadge)) {
    $html = $withoutBadge;
}

$heroStyles = <<<'HTML'
<style id="hero-final-styles">
  .hero__picture--final {
    display: block;
    width: 100%;
    background: transparent;
  }

  .hero__image--final {
    display: block;
    width: 100%;
    height: auto;
    max-height: 520px;
    aspect-ratio: 16 / 9;
    object-fit: contain;
    object-position: center bottom;
    background: transparent;
    filter: none !important;
    opacity: 1 !important;
  }

  @media (max-width: 991px) {
    .hero__image--final {
      max-height: none;
      aspect-ratio: 16 / 9;
      object-position: center;
    }
  }

  @media (max-width: 767px) {
    .hero__media {
      margin-top: 8px;
    }

    .hero__image--final {
      width: 100%;
      max-width: none;
    }
  }
</style>
HTML;

if (strpos($html, '</head>') !== false) {
    $html = str_replace('</head>', $heroStyles . "\n</head>", $html);
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
echo $html;
