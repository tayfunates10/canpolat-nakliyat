<?php
declare(strict_types=1);

date_default_timezone_set('Europe/Istanbul');

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function containsText(string $haystack, string $needle): bool
{
    return strpos($haystack, $needle) !== false;
}

function startsWithText(string $haystack, string $needle): bool
{
    return substr($haystack, 0, strlen($needle)) === $needle;
}

function wantsJson(): bool
{
    $accept = strtolower($_SERVER['HTTP_ACCEPT'] ?? '');
    $requestedWith = strtolower($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '');
    $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');

    return containsText($accept, 'application/json')
        || $requestedWith === 'xmlhttprequest'
        || containsText($contentType, 'application/json');
}

function finish(int $status, array $payload): void
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

function cleanText($value, int $maxLength): string
{
    if (!is_string($value)) return '';
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '');
    if (fieldLength($value) > $maxLength) return '';
    return $value;
}

function normalizePhone(string $phone): string
{
    $digits = preg_replace('/\D+/', '', $phone) ?? '';
    if (startsWithText($digits, '0090') && strlen($digits) === 14) $digits = substr($digits, 4);
    if (startsWithText($digits, '90') && strlen($digits) === 12) $digits = substr($digits, 2);
    if (startsWithText($digits, '0') && strlen($digits) === 11) $digits = substr($digits, 1);
    return $digits;
}

function validPhone(string $phone): bool
{
    $digits = normalizePhone($phone);
    return preg_match('/^[1-9][0-9]{9}$/', $digits) === 1;
}

function normalizeMoveDate(string $value): string
{
    $value = trim($value);
    if ($value === '') return '';

    $timezone = new DateTimeZone('Europe/Istanbul');
    $formats = ['!Y-m-d', '!d.m.Y', '!d/m/Y', '!d-m-Y'];

    foreach ($formats as $format) {
        $date = DateTimeImmutable::createFromFormat($format, $value, $timezone);
        $dateErrors = DateTimeImmutable::getLastErrors();
        $validErrors = $dateErrors === false
            || (($dateErrors['warning_count'] ?? 0) === 0 && ($dateErrors['error_count'] ?? 0) === 0);

        if ($date instanceof DateTimeImmutable && $validErrors) {
            $normalized = $date->format('Y-m-d');
            $expected = $date->format(substr($format, 1));
            if ($expected === $value) return $normalized;
        }
    }

    return '';
}

function requestOriginIsAllowed(): bool
{
    $origin = trim($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin === '') return true;

    $originHost = parse_url($origin, PHP_URL_HOST);
    if (!is_string($originHost) || $originHost === '') return false;

    $requestHost = strtolower($_SERVER['HTTP_HOST'] ?? '');
    $requestHost = preg_replace('/:\d+$/', '', $requestHost) ?? $requestHost;
    return strtolower($originHost) === $requestHost;
}

function safeMailbox($value, string $fallback): string
{
    if (!is_string($value)) return $fallback;
    $value = trim(str_replace(["\r", "\n"], '', $value));
    return filter_var($value, FILTER_VALIDATE_EMAIL) !== false ? $value : $fallback;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    finish(405, ['ok' => false, 'message' => 'Bu endpoint yalnızca form gönderimi için kullanılır.']);
}

if (!requestOriginIsAllowed()) {
    finish(403, ['ok' => false, 'message' => 'Form isteğinin kaynağı doğrulanamadı.']);
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 20000) {
    finish(413, ['ok' => false, 'message' => 'Form verisi izin verilen boyutu aşıyor.']);
}

$contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
if (containsText($contentType, 'application/json')) {
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

$rawEmail = is_string($data['eposta'] ?? null) ? trim($data['eposta']) : '';
$rawNotes = is_string($data['notlar'] ?? null) ? trim($data['notlar']) : '';

$name = cleanText($data['adSoyad'] ?? '', 100);
$phone = cleanText($data['telefon'] ?? '', 40);
$email = cleanText($data['eposta'] ?? '', 160);
$from = cleanText($data['nereden'] ?? '', 120);
$to = cleanText($data['nereye'] ?? '', 120);
$date = normalizeMoveDate(cleanText($data['tarih'] ?? '', 40));
$notes = cleanText($data['notlar'] ?? '', 1500);

$errors = [];
if (fieldLength($name) < 3) $errors[] = 'Ad Soyad';
if (!validPhone($phone)) $errors[] = 'Telefon';
if ($rawEmail !== '' && ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false)) $errors[] = 'E-posta';
if (fieldLength($from) < 2) $errors[] = 'Nereden';
if (fieldLength($to) < 2) $errors[] = 'Nereye';
if ($date === '' || $date < date('Y-m-d')) $errors[] = 'Taşınma Tarihi';
if ($rawNotes !== '' && $notes === '') $errors[] = 'Notlar';

if ($errors !== []) {
    finish(422, [
        'ok' => false,
        'message' => 'Lütfen gerekli alanları kontrol edin: ' . implode(', ', $errors) . '.',
        'fields' => $errors,
    ]);
}

/* Aynı bağlantı + telefon kombinasyonundan aşırı hızlı tekrarları kısa süreli sınırla. */
$remoteAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateIdentity = $remoteAddress . '|' . normalizePhone($phone);
$rateFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
    . DIRECTORY_SEPARATOR
    . 'canpolat-quote-'
    . hash('sha256', $rateIdentity)
    . '.rate';
$now = time();
$lastSent = is_file($rateFile) ? (int) @file_get_contents($rateFile) : 0;
if ($lastSent > 0 && ($now - $lastSent) < 45) {
    finish(429, ['ok' => false, 'message' => 'Talebiniz az önce alındı. Yeni bir gönderim için lütfen kısa süre sonra tekrar deneyin.']);
}

$recipient = safeMailbox(getenv('CANPOLAT_QUOTE_EMAIL'), 'info@canpolatnakliyat.com');
$fromEmail = safeMailbox(getenv('CANPOLAT_QUOTE_FROM_EMAIL'), 'info@canpolatnakliyat.com');
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
    'From: Canpolat Nakliyat Web Sitesi <' . $fromEmail . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: CanpolatWebsite/1.0',
];
if ($email !== '') {
    $headers[] = 'Reply-To: ' . $email;
}

$mailSent = @mail($recipient, $encodedSubject, $body, implode("\r\n", $headers));
if (!$mailSent) {
    finish(503, ['ok' => false, 'message' => 'Form şu anda gönderilemedi. Lütfen 0 535 912 06 91 numarasından arayın veya WhatsApp üzerinden ulaşın.']);
}

@file_put_contents($rateFile, (string) $now, LOCK_EX);

finish(200, ['ok' => true, 'message' => 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.']);
