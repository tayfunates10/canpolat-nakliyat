<?php
declare(strict_types=1);

$partsDir = __DIR__ . '/about-canpolat-approved-parts';
$parts = [
    'part-01.b64',
    'part-02.b64',
    'part-03.b64',
    'part-04.b64',
    'part-05.b64',
    'part-06.b64',
    'part-07a.b64',
    'part-07b.b64',
    'part-08.b64',
];

$encoded = '';
foreach ($parts as $part) {
    $path = $partsDir . '/' . $part;
    if (!is_file($path) || !is_readable($path)) {
        http_response_code(500);
        exit;
    }

    $chunk = file_get_contents($path);
    if ($chunk === false) {
        http_response_code(500);
        exit;
    }

    $encoded .= trim($chunk);
}

if (strlen($encoded) !== 52684) {
    http_response_code(500);
    exit;
}

$image = base64_decode($encoded, true);
$expectedSize = 39512;
$expectedSha256 = '21104ece60551cfc8756097d06a5feb968f797b57086da6ad73db60e5bc6ca00';

if (
    !is_string($image) ||
    strlen($image) !== $expectedSize ||
    substr($image, 0, 4) !== 'RIFF' ||
    substr($image, 8, 4) !== 'WEBP' ||
    hash('sha256', $image) !== $expectedSha256
) {
    http_response_code(500);
    exit;
}

$etag = '"' . $expectedSha256 . '"';
header('Content-Type: image/webp');
header('Content-Length: ' . $expectedSize);
header('Cache-Control: public, max-age=31536000, immutable');
header('ETag: ' . $etag);
header('X-Content-Type-Options: nosniff');

if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim((string) $_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
    http_response_code(304);
    exit;
}

echo $image;
