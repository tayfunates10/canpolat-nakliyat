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

/* PDF'deki kurumsal logo header/footer tarafında kullanılır. */
$html = str_replace('assets/images/logo-canpolat.png', 'assets/images/canpolat-logo.svg?v=20260807-15', $html);

/* Yazısız logo işaretinden favicon. */
$iconReplaced = preg_replace(
    '~<link\s+rel="icon"[^>]*>~i',
    '<link rel="icon" href="assets/images/favicon-canpolat.svg?v=20260807-15" type="image/svg+xml">',
    $html,
    1
);
if (is_string($iconReplaced)) {
    $html = $iconReplaced;
}

/*
 * CANPOLAT-PLATFORM-01-R8
 * Her PNG 1536x1024 tam tuvaldir. Objelerin nihai X/Y koordinatları görselin
 * kendi alfa tuvalinde kilitlidir; tarayıcı tarafında yeniden konumlandırma yoktur.
 * Z: P00 → L09 → T00 → L01 → L02 → L04 → L03 → L05 → L06 → L10 → L11 → L07 → L08
 */
$heroMarkup = <<<'HTML'
<div class="hero-animated hero-r8" id="heroAnimated" role="img" aria-label="Canpolat Nakliyat kamyonu, profesyonel taşıma ekibi, paketlenmiş mobilyalar, koliler ve mobilya asansörü bulunan minyatür taşıma sahnesi">
  <div class="hero-animated__canvas hero-r8__canvas">
    <picture class="hero-r8__fallback" aria-hidden="true">
      <source media="(max-width: 991px)" srcset="assets/images/hero-canpolat-mobil.webp">
      <img src="assets/images/hero-canpolat.webp" alt="" width="1200" height="900" decoding="async">
    </picture>

    <img class="hero-r8__layer hero-r8__layer--p00" src="assets/images/hero-r8/platform-p00-r8-reference-exact.png?v=20260807-r8-02" alt="" width="1536" height="1024" fetchpriority="high" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l09" src="assets/images/hero-r8/layer-l09-r6.png?v=20260807-r8-02" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--t00" src="assets/images/hero-r8/truck-t00-r6.png?v=20260807-r8-02" alt="" width="1536" height="1024" fetchpriority="high" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l01" src="assets/images/hero-r8/layer-l01-r6.png?v=20260807-r8-02" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l02" src="assets/images/hero-r8/layer-l02-r6.png?v=20260807-r8-02" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l04" src="assets/images/hero-r8/layer-l04-r6.png?v=20260807-r8-02" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l03" src="assets/images/hero-r8/layer-l03-r6.png?v=20260807-r8-02" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l05" src="assets/images/hero-r8/layer-l05-r6.png?v=20260807-r8-02" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l06" src="assets/images/hero-r8/layer-l06-r6.png?v=20260807-r8-02" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l10" src="assets/images/hero-r8/layer-l10-r6.png?v=20260807-r8-02" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l11" src="assets/images/hero-r8/layer-l11-r6.png?v=20260807-r8-02" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l07" src="assets/images/hero-r8/layer-l07-r6.png?v=20260807-r8-02" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l08" src="assets/images/hero-r8/layer-l08-r6.png?v=20260807-r8-02" alt="" width="1536" height="1024" decoding="async">
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
  <link rel="stylesheet" href="css/hero-animated.css?v=20260807-r8-02">
  <link rel="stylesheet" href="css/hero-position-fix.css?v=20260807-r8-02">
  <script src="js/hero-animated.js?v=20260807-r8-02" defer></script>
HTML;

if (strpos($html, '</head>') !== false) {
    $html = str_replace('</head>', $assets . "\n</head>", $html);
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
echo $html;
