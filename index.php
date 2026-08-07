<?php
declare(strict_types=1);

$cacheResetCookie = 'canpolat_r8_10_cache_reset';
$mustResetClientCache = !isset($_COOKIE[$cacheResetCookie]);

if ($mustResetClientCache) {
    /* Bir kez: eski LiteSpeed sayfa snapshot'ını ve tarayıcı cache'ini temizle. */
    header('X-LiteSpeed-Purge: *');
    header('Clear-Site-Data: "cache"');
    setcookie($cacheResetCookie, '1', time() + 31536000, '/');
}

$indexFile = __DIR__ . '/index.html';
$html = @file_get_contents($indexFile);

if ($html === false) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo 'Ana sayfa dosyası okunamadı.';
    exit;
}

$html = str_replace('assets/images/logo-canpolat.png', 'assets/images/canpolat-logo.svg?v=20260808-02', $html);

/* Eski hero hiçbir koşulda preload, sosyal paylaşım görseli veya fallback olarak kullanılmaz. */
$html = preg_replace(
    '~\s*<link\s+rel="preload"\s+as="image"\s+href="assets/images/hero-canpolat(?:-mobil)?\.webp"[^>]*>~i',
    '',
    $html
) ?? $html;
$html = str_replace(
    'https://www.canpolatnakliyat.com/assets/images/hero-canpolat.webp',
    'https://www.canpolatnakliyat.com/assets/images/canpolat-logo.svg',
    $html
);

$iconReplaced = preg_replace(
    '~<link\s+rel="icon"[^>]*>~i',
    '<link rel="icon" href="assets/images/favicon-canpolat.svg?v=20260808-02" type="image/svg+xml">',
    $html,
    1
);
if (is_string($iconReplaced)) {
    $html = $iconReplaced;
}

$heroMarkup = <<<'HTML'
<div class="hero-animated hero-r8" id="heroAnimated" role="img" aria-label="Canpolat Nakliyat kamyonu, profesyonel taşıma ekibi, paketlenmiş mobilyalar, koliler ve mobilya asansörü bulunan minyatür taşıma sahnesi">
  <div class="hero-animated__canvas hero-r8__canvas">
    <img class="hero-r8__layer hero-r8__layer--p00" src="assets/images/hero-r8/platform-p00-r8-reference-exact.png?v=20260808-r8-10" alt="" width="1536" height="1024" fetchpriority="high" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l09" src="assets/images/hero-r8/layer-l09-r6.png?v=20260808-r8-10" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--t00" src="assets/images/hero-r8/truck-t00-r6.png?v=20260808-r8-10" alt="" width="1536" height="1024" fetchpriority="high" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l01" src="assets/images/hero-r8/layer-l01-r6.png?v=20260808-r8-10" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l02" src="assets/images/hero-r8/layer-l02-r6.png?v=20260808-r8-10" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l04" src="assets/images/hero-r8/layer-l04-r6.png?v=20260808-r8-10" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l03" src="assets/images/hero-r8/layer-l03-r6.png?v=20260808-r8-10" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l05" src="assets/images/hero-r8/layer-l05-r6.png?v=20260808-r8-10" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l06" src="assets/images/hero-r8/layer-l06-r6.png?v=20260808-r8-10" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l10" src="assets/images/hero-r8/layer-l10-r6.png?v=20260808-r8-10" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l11" src="assets/images/hero-r8/layer-l11-r6.png?v=20260808-r8-10" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l07" src="assets/images/hero-r8/layer-l07-r6.png?v=20260808-r8-10" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l08" src="assets/images/hero-r8/layer-l08-r6.png?v=20260808-r8-10" alt="" width="1536" height="1024" decoding="async">
  </div>
</div>
HTML;

$heroReplaceCount = 0;
$replacedHtml = preg_replace(
    '~<picture class="hero__picture">.*?</picture>~s',
    $heroMarkup,
    $html,
    1,
    $heroReplaceCount
);

/* Fail closed: template değişirse eski hero ile devam etmek kesinlikle yasak. */
if (!is_string($replacedHtml) || $heroReplaceCount !== 1) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo 'Hero R8 yerleşimi doğrulanamadı.';
    exit;
}
$html = $replacedHtml;

$assets = <<<'HTML'
  <style id="hero-r8-critical">
    .hero__picture,.hero__image,img[src*="hero-canpolat.webp"],img[src*="hero-canpolat-mobil.webp"]{display:none!important}
  </style>
  <link rel="preload" as="image" href="assets/images/hero-r8/platform-p00-r8-reference-exact.png?v=20260808-r8-10" fetchpriority="high">
  <link rel="preload" as="image" href="assets/images/hero-r8/truck-t00-r6.png?v=20260808-r8-10" fetchpriority="high">
  <link rel="stylesheet" href="css/hero-animated.css?v=20260808-r8-10">
  <script src="js/hero-animated.js?v=20260808-r8-10" defer></script>
HTML;

if (strpos($html, '</head>') !== false) {
    $html = str_replace('</head>', $assets . "\n</head>", $html);
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Hero-Version: R8-10');
echo $html;
