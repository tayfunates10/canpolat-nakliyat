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

/**
 * R8 kaynak PNG'leri repoda ve onaylı HTML'de aynen tutulur. Production CI,
 * aynı 3:2 alfa tuvalinin 640/960/1280 px WebP türevlerini üretir. Burada
 * yalnız tarayıcıya srcset/sizes bilgisi eklenir; class, z-sırası, width/height,
 * CSS geometrisi ve animasyon zamanlaması değişmez.
 */
function addResponsiveR8Images(string $html): string
{
    $optimizedDir = __DIR__ . '/assets/images/hero-r8/optimized';
    if (!is_dir($optimizedDir)) {
        return $html;
    }

    $sizes = '(max-width: 960px) 100vw, 62vw';

    $html = preg_replace_callback(
        '~<img\b[^>]*class="[^"]*hero-r8__layer[^"]*"[^>]*src="/assets/images/hero-r8/([^"/?]+)\.png"[^>]*>~i',
        static function (array $match) use ($optimizedDir, $sizes): string {
            $tag = $match[0];
            $stem = $match[1];

            $candidates = [];
            foreach ([640, 960, 1280] as $width) {
                $diskPath = $optimizedDir . '/' . $stem . '-' . $width . '.webp';
                if (!is_file($diskPath) || filesize($diskPath) === 0) {
                    return $tag;
                }
                $candidates[] = '/assets/images/hero-r8/optimized/' . $stem . '-' . $width . '.webp ' . $width . 'w';
            }

            if (!preg_match('~\bsrcset=~i', $tag)) {
                $tag = preg_replace(
                    '~\s*/?>$~',
                    ' srcset="' . implode(', ', $candidates) . '" sizes="' . $sizes . '">',
                    $tag,
                    1
                ) ?? $tag;
            }

            if (!preg_match('~\bdecoding=~i', $tag)) {
                $tag = preg_replace('~\s*>$~', ' decoding="async">', $tag, 1) ?? $tag;
            }

            return $tag;
        },
        $html
    ) ?? $html;

    // P00 ve T00 masaüstünde preload edilmeye devam eder; preload da aynı
    // responsive adayları kullanır, böylece artık kullanılmayan büyük PNG için
    // ikinci bir ağ isteği oluşmaz.
    foreach (['platform-p00-r8-reference-exact', 'truck-t00-r6'] as $stem) {
        $allVariantsExist = true;
        $srcset = [];
        foreach ([640, 960, 1280] as $width) {
            $diskPath = $optimizedDir . '/' . $stem . '-' . $width . '.webp';
            if (!is_file($diskPath) || filesize($diskPath) === 0) {
                $allVariantsExist = false;
                break;
            }
            $srcset[] = '/assets/images/hero-r8/optimized/' . $stem . '-' . $width . '.webp ' . $width . 'w';
        }

        if (!$allVariantsExist) {
            continue;
        }

        $pattern = '~<link\b(?=[^>]*rel="preload")(?=[^>]*as="image")(?=[^>]*href="/assets/images/hero-r8/' . preg_quote($stem, '~') . '\.png")[^>]*>~i';
        $replacement = '<link rel="preload" as="image" href="/assets/images/hero-r8/optimized/' . $stem . '-1280.webp" imagesrcset="' . implode(', ', $srcset) . '" imagesizes="62vw" fetchpriority="high" media="(min-width: 961px)">';
        $html = preg_replace($pattern, $replacement, $html, 1) ?? $html;
    }

    return $html;
}

$template = file_get_contents($templatePath);
if (!is_string($template)) {
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

echo addResponsiveR8Images($template);
