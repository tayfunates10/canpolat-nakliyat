#!/usr/bin/env bash
# Canlı siteyi tanılar: hangi yol ne döndürüyor, gövde gerçekten bizim sayfamız mı,
# yoksa istekler araya giren tek bir sayfaya mı düşüyor.
#
# Yayın doğrulaması "her yol 200 ama içerik bizim değil" diye düştüğünde tek
# başına HTTP kodları yetmiyordu; bu betik kanıtı basar.
#
# Kullanım: scripts/live-probe.sh [taban-url]
set -Eeuo pipefail

BASE_URL="${1:-${BASE_URL:-https://www.canpolatnakliyat.com}}"
QUERY="probe=$(date +%s)"
WORK="$(mktemp -d)"
trap 'rm -rf "${WORK}"' EXIT

# Sağlık kontrolünün varsayılan curl kimliğiyle bot filtrelerine takılmaması için
# gerçek bir tarayıcı kimliği kullanılır; istekler yine kendi sitemize gider.
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
COMMON=(-sS --compressed --connect-timeout 10 --max-time 30 -A "${UA}"
        -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        -H 'Accept-Language: tr-TR,tr;q=0.9,en;q=0.8'
        -H 'Cache-Control: no-cache')

printf 'Canlı tanı: %s\n' "${BASE_URL}"
printf 'Zaman: %s\n' "$(date -u '+%Y-%m-%d %H:%M:%SZ')"
printf 'Çıkış IP: %s\n\n' "$(curl -s --max-time 15 https://api.ipify.org 2>/dev/null || echo bilinmiyor)"

declare -a labels=() fingerprints=()

probe() {
  local label="$1" url="$2"
  shift 2
  local head="${WORK}/${label}.head" body="${WORK}/${label}.body"

  local code
  code="$(curl "${COMMON[@]}" "$@" -D "${head}" -o "${body}" -w '%{http_code}' "${url}" || echo 000)"

  local size server ctype location fingerprint
  size="$(wc -c < "${body}" | tr -d ' ')"
  server="$(grep -i '^server:' "${head}" | head -n 1 | tr -d '\r' | cut -d' ' -f2- || true)"
  ctype="$(grep -i '^content-type:' "${head}" | head -n 1 | tr -d '\r' | cut -d' ' -f2- || true)"
  location="$(grep -i '^location:' "${head}" | head -n 1 | tr -d '\r' | cut -d' ' -f2- || true)"
  fingerprint="$(head -c 2048 "${body}" | sha256sum | cut -c1-12)"

  printf '%-14s kod=%-3s boyut=%-7s parmakizi=%s\n' "${label}" "${code}" "${size}" "${fingerprint}"
  printf '%-14s server=%s tip=%s%s\n' "" "${server:-yok}" "${ctype:-yok}" "${location:+ yönlendirme=${location}}"
  printf '%-14s gövde: %s\n\n' "" "$(head -c 300 "${body}" | tr '\n\r\t' '   ' | tr -s ' ')"

  labels+=("${label}")
  fingerprints+=("${fingerprint}")
}

probe anasayfa   "${BASE_URL}/?${QUERY}" -L
probe robots     "${BASE_URL}/robots.txt?${QUERY}" -L
probe hizmet     "${BASE_URL}/hizmetler/paketleme-montaj.html?${QUERY}" -L
probe olmayan    "${BASE_URL}/kesinlikle-olmayan-sayfa-${QUERY}"
probe silinmis   "${BASE_URL}/assets/images/hero-canpolat.webp?${QUERY}"
probe api_get    "${BASE_URL}/api/teklif.php?${QUERY}" -H 'Accept: application/json'

printf '=== Değerlendirme ===\n'

unique="$(printf '%s\n' "${fingerprints[@]}" | sort -u | wc -l | tr -d ' ')"
if (( unique <= 2 )); then
  printf 'TESPİT: %s yoldan yalnız %s farklı gövde geldi. Var olan ve olmayan\n' "${#fingerprints[@]}" "${unique}"
  printf '        yollar aynı sayfayı döndürüyor; istekler sitenin kök dizinine\n'
  printf '        ulaşmadan araya giren bir sayfaya düşüyor (park/askı sayfası ya\n'
  printf '        da bot filtresi). Sunucudaki dosyalarla ilgisi yok.\n'
else
  printf 'Yollar birbirinden farklı gövdeler döndürüyor; istekler siteye ulaşıyor.\n'
fi

if grep -qil 'suspend\|parked\|coming soon\|askıya\|yapım aşamas' "${WORK}/anasayfa.body"; then
  printf 'İPUCU: ana sayfa gövdesinde park/askı ifadesi geçiyor.\n'
fi
if grep -qil 'captcha\|cloudflare\|access denied\|blocked\|sucuri\|imunify\|mod_security\|erişim engel' "${WORK}/anasayfa.body" "${WORK}/olmayan.body"; then
  printf 'İPUCU: gövdede bot filtresi/güvenlik duvarı ifadesi geçiyor.\n'
fi
if grep -q 'hero-r8__layer' "${WORK}/anasayfa.body"; then
  printf 'İYİ: ana sayfa gövdesi bizim yayınladığımız Hero R8 işaretlemesini içeriyor.\n'
fi
