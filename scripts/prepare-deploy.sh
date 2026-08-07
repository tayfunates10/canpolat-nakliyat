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
  "404.html"
  "hakkimizda.html"
  "gizlilik.html"
  "robots.txt"
  "sitemap.xml"
  "manifest.webmanifest"
  ".htaccess"
  "assets"
  "css"
  "js"
  "hizmetler"
  "bolgeler"
)

required_paths=(
  "${publish_paths[@]}"
  "css/hero-animated.css"
  "js/hero-animated.js"
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
  "index.php"
  "index.html"
  "css/style.css"
  "css/hero-animated.css"
  "js/script.js"
  "js/hero-animated.js"
  "assets/images/hero-animated/platform.webp"
  "assets/images/hero-animated/truck.webp"
  "assets/images/hero-animated/box_stack.webp"
  "assets/images/hero-animated/mattress_worker.webp"
  "assets/images/hero-animated/left_trolley.webp"
  "assets/images/hero-animated/chair.webp"
  "assets/images/hero-animated/carry_chair.webp"
  "assets/images/hero-animated/right_stack.webp"
  "assets/images/hero-animated/box_worker.webp"
)

for file in "${required_output_files[@]}"; do
  if [[ ! -s "${OUTPUT_PATH}/${file}" ]]; then
    echo "HATA: Yayın çıktısı eksik veya boş: ${file}" >&2
    exit 1
  fi
done

printf 'Yayın paketi başarıyla hazırlandı: %s\n' "${OUTPUT_PATH}"
