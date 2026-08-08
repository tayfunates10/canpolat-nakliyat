<?php
declare(strict_types=1);

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if ($requestPath === '/index.php') {
    header('Location: https://canpolatnakliyat.com/', true, 301);
    exit;
}

$cacheResetCookie = 'canpolat_r8_11_cache_reset';
$mustResetClientCache = !isset($_COOKIE[$cacheResetCookie]);

if ($mustResetClientCache) {
    header('X-LiteSpeed-Purge: *');
    header('Clear-Site-Data: "cache"');
    setcookie($cacheResetCookie, '1', time() + 31536000, '/', '', true, true);
}

$indexFile = __DIR__ . '/index-template.html';
$html = @file_get_contents($indexFile);

if ($html === false) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo 'Ana sayfa şablonu okunamadı.';
    exit;
}

/* Tek canonical alan adı: HTTPS + non-www. */
$html = str_replace('https://www.canpolatnakliyat.com', 'https://canpolatnakliyat.com', $html);
$html = str_replace('assets/images/logo-canpolat.png', 'assets/images/canpolat-logo.svg?v=20260808-03', $html);
$html = str_replace('href="css/style.css"', 'href="css/style.css?v=20260808-r8-11"', $html);

/*
 * Şablondaki eski, koşulsuz ticari vaatleri production çıktısında nitelendir.
 * Sigorta/ek güvence kapsamı ve montaj kapsamı ancak teklif/sözleşme aşamasında
 * netleştirilebileceği için tüm ziyaretçilere garanti edilmiş gibi sunulmaz.
 * Aynı metinler JSON-LD FAQ içinde de bulunduğundan str_replace her iki kopyayı
 * birlikte günceller ve görünen SSS ile yapılandırılmış veri tutarlı kalır.
 */
$html = str_replace(
    'Eşyalarım sigortalı mı taşınıyor?',
    'Taşıma kapsamı ve ek güvence nasıl belirleniyor?',
    $html
);
$html = str_replace(
    'Taşıma kapsamına göre eşyalarınız sigortalı olarak taşınır. Ayrıntılar sözleşme öncesinde açıklanır.',
    'Taşıma kapsamı, sorumluluklar ve varsa ek güvence seçenekleri teklif ve sözleşme aşamasında açıkça belirtilir.',
    $html
);
$html = str_replace(
    'Edremit ve çevresinde hızlı, güvenli ve sigortalı nakliyat hizmeti.',
    'Edremit ve çevresinde planlı, özenli ve ulaşılabilir nakliyat hizmeti.',
    $html
);
$html = str_replace(
    'Ücretsiz keşif ve hızlı teklif için formu doldurun, sizi arayalım.',
    'Taşıma bilgilerinizi paylaşın; teklif değerlendirmesi için sizi arayalım.',
    $html
);
$html = str_replace(
    'Ücretsiz ekspertiz ile ihtiyaçlarınıza uygun plan oluşturuyoruz.',
    'Taşıma bilgilerini önceden değerlendirerek ihtiyaçlarınıza uygun plan oluşturuyoruz.',
    $html
);
$html = str_replace(
    'Yeni adresinizde eşyalarınızı yerleştirip montajını yapıyoruz.',
    'Taşıma kapsamında sökülen ve yeniden kuruluma uygun mobilyalara montaj desteği sağlıyoruz.',
    $html
);

/* CSP ile çakışan eski inline boot scriptini kaldır; ana JS zaten görsel fallback yönetiyor. */
$html = preg_replace(
    '~\s*<!-- Eksik görsellerde.*?-->\s*<script>.*?</script>\s*~s',
    "\n",
    $html,
    1
) ?? $html;

/* Formu progressive-enhancement uyumlu gerçek POST endpoint'ine bağla. */
$html = str_replace(
    '<form class="quote__form" id="quote-form" novalidate>',
    '<form class="quote__form" id="quote-form" action="/api/teklif.php" method="post">',
    $html
);
$html = str_replace(
    '<p class="form-alert" id="form-alert" role="alert" hidden></p>',
    '<p class="form-alert" id="form-alert" role="alert" hidden></p>\n          <div aria-hidden="true" style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden"><label for="website">Web sitesi</label><input type="text" id="website" name="website" tabindex="-1" autocomplete="off"></div>',
    $html
);
$html = str_replace(
    '<button class="btn btn--primary btn--submit" type="submit">',
    '<p class="quote__subtitle" style="margin:10px 0 0">Kişisel verileriniz yalnız teklif talebinizi yanıtlamak ve taşıma planını değerlendirmek amacıyla işlenir. Ayrıntılar için <a href="/gizlilik.html" style="text-decoration:underline">Gizlilik ve Kişisel Veriler</a> sayfasını inceleyin.</p>\n\n          <button class="btn btn--primary btn--submit" type="submit">',
    $html
);

/* Hizmet kartlarındaki “Detaylı Bilgi” aksiyonları gerçek detay sayfalarına gider. */
$serviceUrls = [
    '/hizmetler/evden-eve-nakliyat.html',
    '/hizmetler/sehirler-arasi-nakliyat.html',
    '/hizmetler/ofis-isyeri-tasima.html',
    '/hizmetler/asansorlu-tasima.html',
    '/hizmetler/paketleme-montaj.html',
];
$serviceIndex = 0;
$serviceReplaceCount = 0;
$linkedHtml = preg_replace_callback(
    '~<a class="service-card" href="#iletisim">~',
    static function (array $match) use (&$serviceIndex, $serviceUrls): string {
        if (!isset($serviceUrls[$serviceIndex])) {
            return $match[0];
        }
        $url = $serviceUrls[$serviceIndex++];
        return '<a class="service-card" href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '">';
    },
    $html,
    5,
    $serviceReplaceCount
);
if (is_string($linkedHtml) && $serviceReplaceCount === 5) {
    $html = $linkedHtml;
}

/* Henüz gerçek hesap adresi olmayan sosyal ikonları ve boş şartlar linkini yayınlama. */
$html = preg_replace('~\s*<ul class="social">.*?</ul>~s', '', $html, 1) ?? $html;
$html = str_replace('          <li><a href="#" data-noop>Kullanım Şartları</a></li>\n', '', $html);

$html = preg_replace(
    '~\s*<link\s+rel="preload"\s+as="image"\s+href="assets/images/hero-canpolat(?:-mobil)?\.webp"[^>]*>~i',
    '',
    $html
) ?? $html;
$html = str_replace(
    'https://canpolatnakliyat.com/assets/images/hero-canpolat.webp',
    'https://canpolatnakliyat.com/assets/images/canpolat-logo.svg',
    $html
);

$iconReplaced = preg_replace(
    '~<link\s+rel="icon"[^>]*>~i',
    '<link rel="icon" href="assets/images/favicon-canpolat.svg?v=20260808-03" type="image/svg+xml">',
    $html,
    1
);
if (is_string($iconReplaced)) {
    $html = $iconReplaced;
}

$heroMarkup = <<<'HTML'
<div class="hero-animated hero-r8" id="heroAnimated" role="img" aria-label="Canpolat Nakliyat kamyonu, profesyonel taşıma ekibi, paketlenmiş mobilyalar, koliler ve mobilya asansörü bulunan minyatür taşıma sahnesi">
  <div class="hero-animated__canvas hero-r8__canvas">
    <img class="hero-r8__layer hero-r8__layer--p00" src="assets/images/hero-r8/platform-p00-r8-reference-exact.png?v=20260808-r8-11" alt="" width="1536" height="1024" fetchpriority="high" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l09" src="assets/images/hero-r8/layer-l09-r6.png?v=20260808-r8-11" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--t00" src="assets/images/hero-r8/truck-t00-r6.png?v=20260808-r8-11" alt="" width="1536" height="1024" fetchpriority="high" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l01" src="assets/images/hero-r8/layer-l01-r6.png?v=20260808-r8-11" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l02" src="assets/images/hero-r8/layer-l02-r6.png?v=20260808-r8-11" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l04" src="assets/images/hero-r8/layer-l04-r6.png?v=20260808-r8-11" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l03" src="assets/images/hero-r8/layer-l03-r6.png?v=20260808-r8-11" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l05" src="assets/images/hero-r8/layer-l05-r6.png?v=20260808-r8-11" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l06" src="assets/images/hero-r8/layer-l06-r6.png?v=20260808-r8-11" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l10" src="assets/images/hero-r8/layer-l10-r6.png?v=20260808-r8-11" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l11" src="assets/images/hero-r8/layer-l11-r6.png?v=20260808-r8-11" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l07" src="assets/images/hero-r8/layer-l07-r6.png?v=20260808-r8-11" alt="" width="1536" height="1024" decoding="async">
    <img class="hero-r8__layer hero-r8__layer--l08" src="assets/images/hero-r8/layer-l08-r6.png?v=20260808-r8-11" alt="" width="1536" height="1024" decoding="async">
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
    html:not(.hero-r8-mounted) .hero__media{visibility:hidden!important}
    html.hero-r8-mounted .hero__media{visibility:visible!important}
    .hero__picture,.hero__image,.hero__media>picture{display:none!important}
  </style>
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="preload" as="image" href="assets/images/hero-r8/platform-p00-r8-reference-exact.png?v=20260808-r8-11" fetchpriority="high">
  <link rel="preload" as="image" href="assets/images/hero-r8/truck-t00-r6.png?v=20260808-r8-11" fetchpriority="high">
  <link rel="stylesheet" href="css/hero-animated.css?v=20260808-r8-13">
  <script src="js/quote-form.js?v=20260808-01" defer></script>
  <script src="js/hero-animated.js?v=20260808-r8-11" defer></script>
HTML;

if (strpos($html, '</head>') !== false) {
    $html = str_replace('</head>', $assets . "\n</head>", $html);
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, max-age=0, must-revalidate');
header('X-Hero-Version: R8-11');
echo $html;
