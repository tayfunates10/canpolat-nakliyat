#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="${CPANEL_REPOSITORY_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
DEPLOY_PATH="${HOME}/public_html/canpolatnakliyat.com"
STAGING_PATH="$(mktemp -d "${HOME}/.canpolat-deploy.XXXXXX")"

cleanup() {
  rm -rf "${STAGING_PATH}"
}
trap cleanup EXIT

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
  "tools/hero/animated/assets.tar.gz"
  "css/hero-animated.css"
  "js/hero-animated.js"
)

for path in "${required_paths[@]}"; do
  if [[ ! -e "${REPO_ROOT}/${path}" ]]; then
    echo "HATA: Yayın için gerekli dosya veya klasör eksik: ${path}" >&2
    exit 1
  fi
done

mkdir -p "${DEPLOY_PATH}"

for path in "${publish_paths[@]}"; do
  cp -a "${REPO_ROOT}/${path}" "${STAGING_PATH}/"
done

rm -f \
  "${STAGING_PATH}/assets/images/hero-canpolat.webp" \
  "${STAGING_PATH}/assets/images/hero-canpolat-mobil.webp" \
  "${STAGING_PATH}/assets/images/hero-canpolat-final.webp" \
  "${STAGING_PATH}/assets/images/hero-layout.webp"
rm -rf "${STAGING_PATH}/assets/images/hero-parts" \
       "${STAGING_PATH}/assets/images/hero-animated"

mkdir -p "${STAGING_PATH}/assets/images/hero-animated"
tar -xzf "${REPO_ROOT}/tools/hero/animated/assets.tar.gz" \
  -C "${STAGING_PATH}/assets/images/hero-animated"

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
  if [[ ! -s "${STAGING_PATH}/${file}" ]]; then
    echo "HATA: Yayın çıktısı eksik veya boş: ${file}" >&2
    exit 1
  fi
done

find "${DEPLOY_PATH}" -mindepth 1 -maxdepth 1 \
  ! -name 'cgi-bin' \
  ! -name '.well-known' \
  -exec rm -rf -- {} +

cp -a "${STAGING_PATH}/." "${DEPLOY_PATH}/"

find "${DEPLOY_PATH}" -type d -exec chmod 755 {} +
find "${DEPLOY_PATH}" -type f -exec chmod 644 {} +

for file in "index.php" "css/hero-animated.css" "js/hero-animated.js" "assets/images/hero-animated/truck.webp"; do
  if [[ ! -s "${DEPLOY_PATH}/${file}" ]]; then
    echo "HATA: Canlı klasörde dosya doğrulanamadı: ${file}" >&2
    exit 1
  fi
done

printf 'Canpolat Nakliyat animasyonlu hero başarıyla yayınlandı: %s\n' "${DEPLOY_PATH}"
