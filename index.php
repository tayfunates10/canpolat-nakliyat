<?php
declare(strict_types=1);

$indexFile = __DIR__ . '/index-template.html';
$html = @file_get_contents($indexFile);

if ($html === false) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    header('Cache-Control: no-store, max-age=0');
    echo 'Ana sayfa şablonu okunamadı.';
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, must-revalidate, max-age=0');
header('X-Hero-Version: R8-SEO-01');
echo $html;
