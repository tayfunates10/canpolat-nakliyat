<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function wantsJson(): bool
{
    $accept = strtolower($_SERVER['HTTP_ACCEPT'] ?? '');
    $requestedWith = strtolower($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '');
    $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');

    return str_contains($accept, 'application/json')
        || $requestedWith === 'xmlhttprequest'
        || str_contains($contentType, 'application/json');
}

function finish(int $status, array $payload): never
{
    http_response_code($status);

    if (!wantsJson()) {
        $result = $status >= 200 && $status < 300 ? 'basarili' : 'hata';
        header('Location: /?teklif=' . $result . '#iletisim', true, 303);
        exit;
    }

    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fieldLength(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function cleanText(mixed $value, int $maxLength): string
{
    if (!is_string($value)) return '';
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '');
    if (fieldLength($value) > $maxLength) return '';
    return $value;
}

function validPhone(string $phone): bool
{
    $digits = preg_replace('/\D+/', '', $phone) ?? '';
    if (str_starts_with($digits, '90') && strlen($digits) === 12) $digits = substr($digits, 2);
    if (str_starts_with($digits, '0') && strlen($digits) === 11) $digits = substr($digits, 1);
    return strlen($digits) === 10 && str_starts_with($digits, '5');
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    finish(405, ['ok' => false, 'message' => 'Bu endpoint yalnızca form gönderimi için kullanılır.']);
}

$contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
if (str_contains($contentType, 'application/json')) {
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 20000) {
        finish(400, ['ok' => false, 'message' => 'Form verisi okunamadı.']);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        finish(400, ['ok' => false, 'message' => 'Geçersiz form verisi.']);
    }
} else {
    $data = $_POST;
}

/* Basit honeypot: gerçek kullanıcı bu alanı görmez/doldurmaz. */
$website = cleanText($data['website'] ?? '', 200);
if ($website !== '') {
    finish(200, ['ok' => true, 'message' => 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.']);
}

$name = cleanText($data['adSoyad'] ?? '', 100);
$phone = cleanText($data['telefon'] ?? '', 40);
$email = cleanText($data['eposta'] ?? '', 160);
$from = cleanText($data['nereden'] ?? '', 120);
$to = cleanText($data['nereye'] ?? '', 120);
$date = cleanText($data['tarih'] ?? '', 40);
$notes = cleanText($data['notlar'] ?? '', 1500);

$errors = [];
if (fieldLength($name) < 3) $errors[] = 'Ad Soyad';
if (!validPhone($phone)) $errors[] = 'Telefon';
if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) $errors[] = 'E-posta';
if (fieldLength($from) < 2) $errors[] = 'Nereden';
if (fieldLength($to) < 2) $errors[] = 'Nereye';
if (fieldLength($date) < 4) $errors[] = 'Taşınma Tarihi';

if ($errors !== []) {
    finish(422, [
        'ok' => false,
        'message' => 'Lütfen gerekli alanları kontrol edin: ' . implode(', ', $errors) . '.',
        'fields' => $errors,
    ]);
}

/* Aynı IP’den aşırı hızlı tekrarları yalnız kısa süreli, hashlenmiş teknik anahtarla sınırla. */
$remoteAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
    . DIRECTORY_SEPARATOR
    . 'canpolat-quote-'
    . hash('sha256', $remoteAddress)
    . '.rate';
$now = time();
$lastSent = is_file($rateFile) ? (int) @file_get_contents($rateFile) : 0;
if ($lastSent > 0 && ($now - $lastSent) < 45) {
    finish(429, ['ok' => false, 'message' => 'Talebiniz az önce alındı. Yeni bir gönderim için lütfen kısa süre sonra tekrar deneyin.']);
}

$recipient = getenv('CANPOLAT_QUOTE_EMAIL') ?: 'info@canpolatnakliyat.com';
$subject = 'Canpolat Nakliyat - Yeni Fiyat Teklifi Talebi';
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$lines = [
    'Yeni fiyat teklifi talebi',
    '-------------------------',
    'Ad Soyad: ' . $name,
    'Telefon: ' . $phone,
    'E-posta: ' . ($email !== '' ? $email : '-'),
    'Nereden: ' . $from,
    'Nereye: ' . $to,
    'Taşınma Tarihi: ' . $date,
    'Notlar: ' . ($notes !== '' ? $notes : '-'),
    '',
    'Gönderim zamanı: ' . date('Y-m-d H:i:s T'),
];
$body = implode("\r\n", $lines);

$headers = [
    'From: Canpolat Nakliyat Web Sitesi <website@canpolatnakliyat.com>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: CanpolatWebsite/1.0',
];
if ($email !== '') {
    $safeReplyTo = str_replace(["\r", "\n"], '', $email);
    $headers[] = 'Reply-To: ' . $safeReplyTo;
}

$mailSent = @mail($recipient, $encodedSubject, $body, implode("\r\n", $headers));
if (!$mailSent) {
    finish(503, ['ok' => false, 'message' => 'Form şu anda gönderilemedi. Lütfen 0 535 912 06 91 numarasından arayın veya WhatsApp üzerinden ulaşın.']);
}

@file_put_contents($rateFile, (string) $now, LOCK_EX);

finish(200, ['ok' => true, 'message' => 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.']);
