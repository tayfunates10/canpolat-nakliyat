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
<picture class="hero__picture hero__picture--layout">
  <img
    class="hero__image hero__image--layout"
    src="assets/images/hero-layout.webp?v=20260806-10"
    alt="Canpolat Nakliyat kamyonu, profesyonel taşıma çalışanları, paketlenmiş eşyalar, koliler ve taş platform"
    width="1280"
    height="720"
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
<style id="hero-layout-styles">
  .hero,
  .hero__inner,
  .hero__content,
  .hero__media {
    min-width: 0;
  }

  .hero__media {
    position: relative;
    overflow: hidden;
    background: transparent;
  }

  .hero__picture--layout {
    display: block;
    width: 100%;
    margin: 0;
    overflow: hidden;
    background: transparent;
  }

  .hero__image--layout {
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
    transform: none !important;
  }

  .hero__badge,
  .hero__dots {
    display: none !important;
  }

  @media (max-width: 1199px) {
    .hero__image--layout {
      max-height: 460px;
    }
  }

  @media (max-width: 991px) {
    .hero__media {
      width: 100%;
      max-width: 900px;
      margin-inline: auto;
      padding: 0;
    }

    .hero__image--layout {
      width: 100%;
      max-height: none;
      object-position: center;
    }
  }

  @media (max-width: 767px) {
    .hero__media {
      width: calc(100% + 8px);
      max-width: none;
      margin: 8px -4px 0;
    }

    .hero__picture--layout,
    .hero__image--layout {
      width: 100%;
      max-width: 100%;
    }
  }

  @media (max-width: 430px) {
    .hero__media {
      width: calc(100% + 4px);
      margin-inline: -2px;
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
