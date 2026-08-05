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
  "tools/hero/parts"
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

mkdir -p "${STAGING_PATH}/assets/images/hero-parts"
cp -a "${REPO_ROOT}/tools/hero/parts/." \
  "${STAGING_PATH}/assets/images/hero-parts/"

required_output_files=(
  "index.php"
  "index.html"
  "css/style.css"
  "css/hero-fix.css"
  "css/hero-base-fix.css"
  "js/script.js"
  "js/hero-fix.js"
  "js/hero-base-fix.js"
  "assets/images/hero-parts/base.webp"
  "assets/images/hero-parts/grp_left.webp"
  "assets/images/hero-parts/grp_right.webp"
  "assets/images/hero-parts/lift.webp"
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

for file in "index.php" "assets/images/hero-parts/base.webp" "js/hero-base-fix.js"; do
  if [[ ! -s "${DEPLOY_PATH}/${file}" ]]; then
    echo "HATA: Canlı klasörde dosya doğrulanamadı: ${file}" >&2
    exit 1
  fi
done

printf 'Canpolat Nakliyat başarıyla yayınlandı: %s\n' "${DEPLOY_PATH}"
