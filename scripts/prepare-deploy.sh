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
  "index.php" "index.html" "index-template.html" "404.html" "hakkimizda.html" "gizlilik.html"
  "robots.txt" "sitemap.xml" "manifest.webmanifest" ".htaccess"
  "api" "assets" "css" "js" "partials" "hizmetler" "bolgeler"
)

required_paths=(
  "${publish_paths[@]}"
  "api/teklif.php"
  "css/hero-animated.css" "css/services-tune.css" "css/section-03.css" "css/section-04.css" "css/section-05.css"
  "partials/section-03-about.inc" "partials/section-04-process.inc" "partials/section-05-why-us.inc"
  "js/hero-animated.js" "js/quote-form.js" "js/section-04.js" "js/section-05.js"
  "hizmetler/paketleme-montaj.html"
  "assets/images/about-canpolat-approved.php"
  "assets/images/about-canpolat-approved-parts"
  "assets/images/hero-r8/ASSET-MANIFEST.md"
  "assets/images/service-evden-eve.webp" "assets/images/service-sehirler-arasi.webp"
  "assets/images/service-ofis.webp" "assets/images/service-asansorlu.webp" "assets/images/service-paketleme.webp"
)
for path in "${required_paths[@]}"; do
  [[ -e "${REPO_ROOT}/${path}" ]] || { echo "HATA: Yayın için gerekli dosya veya klasör eksik: ${path}" >&2; exit 1; }
done

for path in "${publish_paths[@]}"; do cp -a "${REPO_ROOT}/${path}" "${OUTPUT_PATH}/"; done

rm -f \
  "${OUTPUT_PATH}/assets/images/hero-canpolat.webp" \
  "${OUTPUT_PATH}/assets/images/hero-canpolat-mobil.webp" \
  "${OUTPUT_PATH}/assets/images/hero-canpolat-final.webp" \
  "${OUTPUT_PATH}/assets/images/hero-layout.webp" \
  "${OUTPUT_PATH}/assets/images/about-canpolat-approved.svg"
rm -rf "${OUTPUT_PATH}/assets/images/hero-parts"

required_output_files=(
  "index.php" "index.html" "index-template.html" "api/teklif.php"
  "css/style.css" "css/hero-animated.css" "css/services-tune.css" "css/section-03.css" "css/section-04.css" "css/section-05.css"
  "partials/section-03-about.inc" "partials/section-04-process.inc" "partials/section-05-why-us.inc"
  "js/script.js" "js/hero-animated.js" "js/quote-form.js" "js/section-04.js" "js/section-05.js"
  "hizmetler/paketleme-montaj.html"
  "assets/images/about-canpolat-approved.php"
  "assets/images/about-canpolat-approved-parts/part-01.b64"
  "assets/images/about-canpolat-approved-parts/part-02.b64"
  "assets/images/about-canpolat-approved-parts/part-03.b64"
  "assets/images/about-canpolat-approved-parts/part-04.b64"
  "assets/images/about-canpolat-approved-parts/part-05.b64"
  "assets/images/about-canpolat-approved-parts/part-06.b64"
  "assets/images/about-canpolat-approved-parts/part-07a.b64"
  "assets/images/about-canpolat-approved-parts/part-07b.b64"
  "assets/images/about-canpolat-approved-parts/part-08.b64"
  "assets/images/service-evden-eve.webp" "assets/images/service-sehirler-arasi.webp"
  "assets/images/service-ofis.webp" "assets/images/service-asansorlu.webp" "assets/images/service-paketleme.webp"
  "assets/images/hero-r8/platform-p00-r8-reference-exact.png" "assets/images/hero-r8/truck-t00-r6.png"
  "assets/images/hero-r8/layer-l01-r6.png" "assets/images/hero-r8/layer-l02-r6.png"
  "assets/images/hero-r8/layer-l03-r6.png" "assets/images/hero-r8/layer-l04-r6.png"
  "assets/images/hero-r8/layer-l05-r6.png" "assets/images/hero-r8/layer-l06-r6.png"
  "assets/images/hero-r8/layer-l07-r6.png" "assets/images/hero-r8/layer-l08-r6.png"
  "assets/images/hero-r8/layer-l09-r6.png" "assets/images/hero-r8/layer-l10-r6.png"
  "assets/images/hero-r8/layer-l11-r6.png"
)
for file in "${required_output_files[@]}"; do
  [[ -s "${OUTPUT_PATH}/${file}" ]] || { echo "HATA: Yayın çıktısı eksik veya boş: ${file}" >&2; exit 1; }
done

for forbidden in \
  "assets/images/hero-canpolat.webp" \
  "assets/images/hero-canpolat-mobil.webp" \
  "assets/images/about-canpolat-approved.svg"; do
  if [[ -e "${OUTPUT_PATH}/${forbidden}" ]]; then
    echo "HATA: Yasak/eski asset production paketinde bulunmamalı: ${forbidden}" >&2
    exit 1
  fi
done

if grep -Eq 'hero__picture|hero-canpolat(-mobil)?\.webp' "${OUTPUT_PATH}/index.html"; then
  echo "HATA: Public index.html içinde eski hero izi bulundu." >&2
  exit 1
fi

printf 'Yayın paketi başarıyla hazırlandı: %s\n' "${OUTPUT_PATH}"