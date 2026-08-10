<?php
declare(strict_types=1);

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if ($requestPath === '/index.php') {
    header('Location: https://www.canpolatnakliyat.com/', true, 301);
    exit;
}

if (!is_string($requestPath) || $requestPath === '') {
    $requestPath = '/';
}

if ($requestPath !== '/') {
    $notFoundPath = __DIR__ . '/404.html';
    http_response_code(404);
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache, max-age=0, must-revalidate');
    header('X-Robots-Tag: noindex, follow');
    header('X-Hero-Version: R8-11');
    header('Vary: Accept-Encoding');

    if (is_file($notFoundPath) && is_readable($notFoundPath)) {
        readfile($notFoundPath);
    } else {
        echo '<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Sayfa Bulunamadı</title><h1>Sayfa Bulunamadı</h1></html>';
    }
    exit;
}

$templatePath = __DIR__ . '/index-template.html';
if (!is_file($templatePath) || !is_readable($templatePath)) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    header('Cache-Control: no-store, max-age=0');
    header('X-Robots-Tag: noindex, nofollow');
    echo 'Ana sayfa şablonu okunamadı.';
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, max-age=0, must-revalidate');
header('X-Hero-Version: R8-11');
header('Vary: Accept-Encoding');

readfile($templatePath);
