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
  "gizlilik.html"
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

required_paths=(
  "${publish_paths[@]}"
  "api/teklif.php"
  "css/hero-animated.css"
  "css/services-tune.css"
  "js/hero-animated.js"
  "js/quote-form.js"
  "hizmetler/paketleme-montaj.html"
  "assets/images/hero-r8/ASSET-MANIFEST.md"
  "assets/images/service-evden-eve.webp"
  "assets/images/service-sehirler-arasi.webp"
  "assets/images/service-ofis.webp"
  "assets/images/service-asansorlu.webp"
  "assets/images/service-paketleme.webp"
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

# Eski hero varlıklarının production paketine hiçbir şekilde girmesine izin verme.
rm -f \
  "${OUTPUT_PATH}/assets/images/hero-canpolat.webp" \
  "${OUTPUT_PATH}/assets/images/hero-canpolat-mobil.webp" \
  "${OUTPUT_PATH}/assets/images/hero-canpolat-final.webp" \
  "${OUTPUT_PATH}/assets/images/hero-layout.webp"
rm -rf "${OUTPUT_PATH}/assets/images/hero-parts"

required_output_files=(
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
  "assets/images/service-evden-eve.webp"
  "assets/images/service-sehirler-arasi.webp"
  "assets/images/service-ofis.webp"
  "assets/images/service-asansorlu.webp"
  "assets/images/service-paketleme.webp"
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

# Public index.html eski hero markup'ı veya eski görsel yollarını içeremez.
if grep -Eq 'hero__picture|hero-canpolat(-mobil)?\.webp' "${OUTPUT_PATH}/index.html"; then
  echo "HATA: Public index.html içinde eski hero izi bulundu." >&2
  exit 1
fi

printf 'Yayın paketi başarıyla hazırlandı: %s\n' "${OUTPUT_PATH}"
