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

$heroMarkup = <<<'HTML'
<div class="hero-animated" id="heroAnimated" role="img" aria-label="Canpolat Nakliyat kamyonu, profesyonel taşıma ekibi, paketlenmiş mobilyalar, koliler ve taş platform">
  <div class="hero-animated__canvas">
    <img class="hero-layer hero-layer--platform" src="assets/images/hero-animated/platform.webp?v=20260806-12" alt="" width="1200" height="296" fetchpriority="high" decoding="async">
    <img class="hero-layer hero-layer--box-stack" src="assets/images/hero-animated/box_stack.webp?v=20260806-12" alt="" width="477" height="600" decoding="async">
    <img class="hero-layer hero-layer--mattress" src="assets/images/hero-animated/mattress_worker.webp?v=20260806-12" alt="" width="447" height="600" decoding="async">
    <img class="hero-layer hero-layer--left-trolley" src="assets/images/hero-animated/left_trolley.webp?v=20260806-12" alt="" width="433" height="600" decoding="async">
    <img class="hero-layer hero-layer--chair" src="assets/images/hero-animated/chair.webp?v=20260806-12" alt="" width="600" height="365" decoding="async">
    <img class="hero-layer hero-layer--carry-chair" src="assets/images/hero-animated/carry_chair.webp?v=20260806-12" alt="" width="600" height="491" decoding="async">
    <img class="hero-layer hero-layer--right-stack" src="assets/images/hero-animated/right_stack.webp?v=20260806-12" alt="" width="600" height="485" decoding="async">
    <img class="hero-layer hero-layer--truck" src="assets/images/hero-animated/truck.webp?v=20260806-12" alt="" width="900" height="657" fetchpriority="high" decoding="async">
    <img class="hero-layer hero-layer--box-worker" src="assets/images/hero-animated/box_worker.webp?v=20260806-12" alt="" width="251" height="550" decoding="async">
  </div>
</div>
HTML;

$replacedHtml = preg_replace(
    '~<picture class="hero__picture">.*?</picture>~s',
    $heroMarkup,
    $html,
    1
);

if (is_string($replacedHtml)) {
    $html = $replacedHtml;
}

foreach ([
    '~\s*<!-- Lokasyon rozeti -->\s*<div class="hero__badge"[^>]*>.*?</div>~s',
    '~\s*<!-- Mobil dekoratif slider noktaları -->\s*<div class="hero__dots"[^>]*>.*?</div>~s',
] as $pattern) {
    $cleaned = preg_replace($pattern, '', $html, 1);
    if (is_string($cleaned)) {
        $html = $cleaned;
    }
}

$assets = <<<'HTML'
  <link rel="stylesheet" href="css/hero-animated.css?v=20260806-12">
  <link rel="stylesheet" href="css/hero-position-fix.css?v=20260806-12">
  <script src="js/hero-animated.js?v=20260806-12" defer></script>
HTML;

if (strpos($html, '</head>') !== false) {
    $html = str_replace('</head>', $assets . "\n</head>", $html);
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
echo $html;
