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

$assets = <<<'HTML'
  <link rel="stylesheet" href="css/hero-fix.css?v=20260806-4">
  <link rel="stylesheet" href="css/hero-base-fix.css?v=20260806-4">
  <script src="js/hero-fix.js?v=20260806-4" defer></script>
  <script src="js/hero-base-fix.js?v=20260806-4" defer></script>
HTML;

if (strpos($html, '</head>') !== false) {
    $html = str_replace('</head>', $assets . "\n</head>", $html);
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
echo $html;
