<?php
declare(strict_types=1);

$source = __DIR__ . '/about-canpolat-approved.svg';
if (!is_file($source) || !is_readable($source)) {
    http_response_code(404);
    exit;
}

$svg = file_get_contents($source);
if ($svg === false || !preg_match('~data:image/webp;base64,([A-Za-z0-9+/=]+)~', $svg, $match)) {
    http_response_code(500);
    exit;
}

$image = base64_decode($match[1], true);
if ($image === false || strlen($image) < 1024 || substr($image, 0, 4) !== 'RIFF' || substr($image, 8, 4) !== 'WEBP') {
    http_response_code(500);
    exit;
}

$etag = '"' . hash('sha256', $image) . '"';
header('Content-Type: image/webp');
header('Content-Length: ' . strlen($image));
header('Cache-Control: public, max-age=31536000, immutable');
header('ETag: ' . $etag);
header('X-Content-Type-Options: nosniff');

if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim((string) $_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
    http_response_code(304);
    exit;
}

echo $image;
