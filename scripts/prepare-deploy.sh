#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="${CPANEL_REPOSITORY_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
OUTPUT_PATH="${1:-}"

if [[ -z "${OUTPUT_PATH}" ]]; then
  echo "Kullanım: scripts/prepare-deploy.sh <boş-hedef-klasör>" >&2
  exit 1
fi

if [[ ! -d "${OUTPUT_PATH}" ]]; then
  echo "HATA: Yayın çıktı klasörü mevcut değil: ${OUTPUT_PATH}" >&2
  exit 1
fi

if find "${OUTPUT_PATH}" -mindepth 1 -print -quit | grep -q .; then
  echo "HATA: Yayın çıktı klasörü boş olmalıdır: ${OUTPUT_PATH}" >&2
  exit 1
fi

publish_paths=(
  "index.php"
  "index.html"
  "index-template.html"
  "404.html"
  "hakkimizda.html"
  "galeri.html"
  "gizlilik.html"
  "sss.html"
  "robots.txt"
  "sitemap.xml"
  "manifest.webmanifest"
  ".htaccess"
  "api"
  "assets"
  "css"
  "js"
  "hizmetler"
  "bolgeler"
)

gallery_images=(
  "baza-yatak-koruma-ortusu"
  "yagmurda-nakliyat-tasima"
  "kusakli-mobilya-sabitleme"
  "gece-tasima-hizmeti"
  "koltuk-koruyucu-kilif-sarim"
  "kapali-kasa-nakliyat-kamyonu"
  "yatak-koruyucu-kilif-paketleme"
  "yuksek-kata-tasima-hazirligi"
  "salon-koltuk-takimi-paketleme"
  "apartman-onunde-yukleme"
  "kamyon-ici-esya-istifleme"
  "evden-eve-nakliyat-araci-edremit"
  "paketlenmis-esyalar-tasimaya-hazir"
  "sehirler-arasi-nakliyat-istanbul"
  "kamyona-esya-yukleme"
  "asansorlu-tasima-edremit"
)

gallery_files=()
for name in "${gallery_images[@]}"; do
  gallery_files+=("assets/images/galeri/${name}.webp" "assets/images/galeri/${name}-mobil.webp")
done

local_seo_pages=(
  "bolgeler/akcay-nakliyat.html"
  "bolgeler/altinoluk-nakliyat.html"
  "bolgeler/ayvalik-nakliyat.html"
  "bolgeler/burhaniye-nakliyat.html"
  "bolgeler/havran-nakliyat.html"
  "bolgeler/ivrindi-nakliyat.html"
  "bolgeler/kucukkuyu-nakliyat.html"
  "bolgeler/gure-nakliyat.html"
  "bolgeler/gomec-nakliyat.html"
)

required_paths=(
  "${publish_paths[@]}"
  "${gallery_files[@]}"
  "${local_seo_pages[@]}"
  "api/teklif.php"
  "css/hero-animated.css"
  "css/services-tune.css"
  "js/hero-animated.js"
  "js/quote-form.js"
  "hizmetler/paketleme-montaj.html"
  "hizmetler/parca-esya-tasimaciligi.html"
  "galeri.html"
  "sss.html"
  "assets/images/hero-r8/ASSET-MANIFEST.md"
  "assets/images/hero/canpolat-hero-bg-2026.webp"
  "assets/images/service-evden-eve.webp"
  "assets/images/service-sehirler-arasi.webp"
  "assets/images/service-ofis.webp"
  "assets/images/service-asansorlu.webp"
  "assets/images/service-paketleme.webp"
  "assets/images/about-tasima.webp"
  "assets/images/cta-kamyon.webp"
)

for path in "${required_paths[@]}"; do
  if [[ ! -e "${REPO_ROOT}/${path}" ]]; then
    echo "HATA: Yayın için gerekli dosya veya klasör eksik: ${path}" >&2
    exit 1
  fi
done

for path in "${publish_paths[@]}"; do
  cp -a "${REPO_ROOT}/${path}" "${OUTPUT_PATH}/"
done

rm -f \
  "${OUTPUT_PATH}/assets/images/hero-canpolat.webp" \
  "${OUTPUT_PATH}/assets/images/hero-canpolat-mobil.webp" \
  "${OUTPUT_PATH}/assets/images/hero-canpolat-final.webp" \
  "${OUTPUT_PATH}/assets/images/hero-layout.webp"
rm -rf "${OUTPUT_PATH}/assets/images/hero-parts"

required_output_files=(
  "${gallery_files[@]}"
  "${local_seo_pages[@]}"
  "index.php"
  "index.html"
  "index-template.html"
  "api/teklif.php"
  "css/style.css"
  "css/hero-animated.css"
  "css/services-tune.css"
  "js/script.js"
  "js/hero-animated.js"
  "js/quote-form.js"
  "hizmetler/paketleme-montaj.html"
  "hizmetler/parca-esya-tasimaciligi.html"
  "galeri.html"
  "sss.html"
  "assets/images/hero/canpolat-hero-bg-2026.webp"
  "assets/images/service-evden-eve.webp"
  "assets/images/service-sehirler-arasi.webp"
  "assets/images/service-ofis.webp"
  "assets/images/service-asansorlu.webp"
  "assets/images/service-paketleme.webp"
  "assets/images/about-tasima.webp"
  "assets/images/cta-kamyon.webp"
  "assets/images/hero-r8/platform-p00-r8-reference-exact.png"
  "assets/images/hero-r8/truck-t00-r6.png"
  "assets/images/hero-r8/layer-l01-r6.png"
  "assets/images/hero-r8/layer-l02-r6.png"
  "assets/images/hero-r8/layer-l03-r6.png"
  "assets/images/hero-r8/layer-l04-r6.png"
  "assets/images/hero-r8/layer-l05-r6.png"
  "assets/images/hero-r8/layer-l06-r6.png"
  "assets/images/hero-r8/layer-l07-r6.png"
  "assets/images/hero-r8/layer-l08-r6.png"
  "assets/images/hero-r8/layer-l12-r6.png"
  "assets/images/hero-r8/layer-l09-r6.png"
  "assets/images/hero-r8/layer-l10-r6.png"
  "assets/images/hero-r8/layer-l11-r6.png"
)

for file in "${required_output_files[@]}"; do
  if [[ ! -s "${OUTPUT_PATH}/${file}" ]]; then
    echo "HATA: Yayın çıktısı eksik veya boş: ${file}" >&2
    exit 1
  fi
done

for forbidden in \
  "assets/images/hero-canpolat.webp" \
  "assets/images/hero-canpolat-mobil.webp"; do
  if [[ -e "${OUTPUT_PATH}/${forbidden}" ]]; then
    echo "HATA: Eski hero production paketinde bulunmamalı: ${forbidden}" >&2
    exit 1
  fi
done

if grep -Eq 'hero__picture|hero-canpolat(-mobil)?\.webp' "${OUTPUT_PATH}/index.html"; then
  echo "HATA: Public index.html içinde eski hero izi bulundu." >&2
  exit 1
fi

printf 'Yayın paketi başarıyla hazırlandı: %s\n' "${OUTPUT_PATH}"
