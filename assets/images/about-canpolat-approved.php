<?php
declare(strict_types=1);

$source = __DIR__ . '/about-canpolat-approved.svg';
if (!is_file($source) || !is_readable($source)) {
    http_response_code(404);
    exit;
}

$svg = file_get_contents($source);
if ($svg === false) {
    http_response_code(500);
    exit;
}

$marker = 'data:image/webp;base64,';
$start = strpos($svg, $marker);
if ($start === false) {
    http_response_code(500);
    exit;
}
$start += strlen($marker);

$end = strpos($svg, '"', $start);
if ($end === false || $end <= $start) {
    http_response_code(500);
    exit;
}

$encoded = substr($svg, $start, $end - $start);
$encoded = str_replace(["\r", "\n", "\t", " "], '', $encoded);
$image = base64_decode($encoded, true);

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
