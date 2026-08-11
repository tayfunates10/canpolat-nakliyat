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

function appendHtmlAttributes(string $tag, string $attributes): string
{
    $end = strrpos($tag, '>');
    if ($end === false) {
        return $tag;
    }

    return substr($tag, 0, $end) . $attributes . substr($tag, $end);
}

function mapHtmlTags(string $html, string $tagName, callable $mapper): string
{
    $needle = '<' . $tagName;
    $offset = 0;
    $output = '';
    $length = strlen($html);

    while ($offset < $length) {
        $start = strpos($html, $needle, $offset);
        if ($start === false) {
            $output .= substr($html, $offset);
            break;
        }

        $end = strpos($html, '>', $start);
        if ($end === false) {
            $output .= substr($html, $offset);
            break;
        }

        $output .= substr($html, $offset, $start - $offset);
        $tag = substr($html, $start, $end - $start + 1);
        $output .= $mapper($tag);
        $offset = $end + 1;
    }

    return $output;
}

function responsiveR8Candidates(string $stem, string $optimizedDir): ?array
{
    $urls = [];
    foreach ([640, 960, 1280] as $width) {
        $file = $optimizedDir . '/' . $stem . '-' . $width . '.webp';
        if (!is_file($file) || filesize($file) === 0) {
            return null;
        }
        $urls[] = '/assets/images/hero-r8/optimized/' . $stem . '-' . $width . '.webp ' . $width . 'w';
    }

    return $urls;
}

/**
 * Onaylı index-template.html byte düzeyinde korunur. CI tarafından üretilen
 * responsive R8 türevleri varsa yalnız ilgili <img> ve iki preload etiketi
 * çıktı anında zenginleştirilir. CSS sınıfları, width/height, z-sırası,
 * koordinatlar ve animasyon JS'i değişmez. Variantlar yoksa eski readfile
 * akışı kullanılır ve site mevcut PNG'lerle çalışmaya devam eder.
 */
function renderHomeTemplate(string $templatePath): void
{
    $optimizedDir = __DIR__ . '/assets/images/hero-r8/optimized';
    $platformCandidates = responsiveR8Candidates('platform-p00-r8-reference-exact', $optimizedDir);
    $truckCandidates = responsiveR8Candidates('truck-t00-r6', $optimizedDir);

    if ($platformCandidates === null || $truckCandidates === null) {
        readfile($templatePath);
        return;
    }

    $html = file_get_contents($templatePath);
    if (!is_string($html)) {
        readfile($templatePath);
        return;
    }

    $sizes = '(max-width: 960px) 100vw, 62vw';
    $srcPrefix = 'src="/assets/images/hero-r8/';

    $html = mapHtmlTags($html, 'img', static function (string $tag) use ($optimizedDir, $sizes, $srcPrefix): string {
        if (strpos($tag, 'hero-r8__layer') === false) {
            return $tag;
        }

        $srcPos = strpos($tag, $srcPrefix);
        if ($srcPos === false) {
            return $tag;
        }

        $stemStart = $srcPos + strlen($srcPrefix);
        $stemEnd = strpos($tag, '.png"', $stemStart);
        if ($stemEnd === false) {
            return $tag;
        }

        $stem = substr($tag, $stemStart, $stemEnd - $stemStart);
        $candidates = responsiveR8Candidates($stem, $optimizedDir);
        if ($candidates === null || strpos($tag, 'srcset=') !== false) {
            return $tag;
        }

        $attributes = ' srcset="' . implode(', ', $candidates) . '" sizes="' . $sizes . '"';
        if (strpos($tag, 'decoding=') === false) {
            $attributes .= ' decoding="async"';
        }

        return appendHtmlAttributes($tag, $attributes);
    });

    $preloads = [
        'platform-p00-r8-reference-exact' => $platformCandidates,
        'truck-t00-r6' => $truckCandidates,
    ];

    $html = mapHtmlTags($html, 'link', static function (string $tag) use ($preloads): string {
        if (strpos($tag, 'rel="preload"') === false || strpos($tag, 'as="image"') === false) {
            return $tag;
        }

        foreach ($preloads as $stem => $candidates) {
            $href = 'href="/assets/images/hero-r8/' . $stem . '.png"';
            if (strpos($tag, $href) === false) {
                continue;
            }

            return '<link rel="preload" as="image" href="/assets/images/hero-r8/optimized/' . $stem . '-1280.webp" imagesrcset="' . implode(', ', $candidates) . '" imagesizes="62vw" fetchpriority="high" media="(min-width: 961px)">';
        }

        return $tag;
    });

    echo $html;
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, max-age=0, must-revalidate');
header('X-Hero-Version: R8-11');
header('Vary: Accept-Encoding');

renderHomeTemplate($templatePath);
