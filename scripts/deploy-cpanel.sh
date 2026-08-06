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
  "tools/hero/layout-desktop"
)

for path in "${required_paths[@]}"; do
  if [[ ! -e "${REPO_ROOT}/${path}" ]]; then
    echo "HATA: Yayın için gerekli dosya veya klasör eksik: ${path}" >&2
    exit 1
  fi
done

hero_chunks=(
  "hero.part1.b64"
  "hero.part2.b64"
  "hero.part3.b64"
  "hero.part4.b64"
  "hero.part5.b64"
  "hero.part6a.b64"
  "hero.part6b.b64"
)

for part in "${hero_chunks[@]}"; do
  chunk="${REPO_ROOT}/tools/hero/layout-desktop/${part}"
  if [[ ! -s "${chunk}" ]]; then
    echo "HATA: Hero görsel parçası eksik veya boş: ${chunk}" >&2
    exit 1
  fi
done

mkdir -p "${DEPLOY_PATH}"

for path in "${publish_paths[@]}"; do
  cp -a "${REPO_ROOT}/${path}" "${STAGING_PATH}/"
done

BASE64_BIN="$(command -v base64 || true)"
if [[ -z "${BASE64_BIN}" ]]; then
  echo "HATA: Sunucuda base64 komutu bulunamadı." >&2
  exit 1
fi

HERO_B64="${STAGING_PATH}/hero-layout.b64"
HERO_OUTPUT="${STAGING_PATH}/assets/images/hero-layout.webp"

: > "${HERO_B64}"
for part in "${hero_chunks[@]}"; do
  cat "${REPO_ROOT}/tools/hero/layout-desktop/${part}" >> "${HERO_B64}"
done
tr -d '\r\n' < "${HERO_B64}" > "${HERO_B64}.clean"
mv "${HERO_B64}.clean" "${HERO_B64}"

mkdir -p "$(dirname "${HERO_OUTPUT}")"
"${BASE64_BIN}" --decode "${HERO_B64}" > "${HERO_OUTPUT}"
rm -f "${HERO_B64}"

if [[ ! -s "${HERO_OUTPUT}" ]]; then
  echo "HATA: Hero görseli oluşturulamadı." >&2
  exit 1
fi

hero_size="$(wc -c < "${HERO_OUTPUT}")"
if [[ "${hero_size}" -lt 50000 ]]; then
  echo "HATA: Oluşturulan hero görseli beklenenden küçük: ${hero_size} bayt" >&2
  exit 1
fi

hero_header="$(od -An -tx1 -N12 "${HERO_OUTPUT}" | tr -d ' \n')"
if [[ "${hero_header}" != 52494646*57454250 ]]; then
  echo "HATA: Oluşturulan dosya geçerli bir WebP değil." >&2
  exit 1
fi

required_output_files=(
  "index.php"
  "index.html"
  "css/style.css"
  "js/script.js"
  "assets/images/hero-layout.webp"
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

for file in "index.php" "assets/images/hero-layout.webp"; do
  if [[ ! -s "${DEPLOY_PATH}/${file}" ]]; then
    echo "HATA: Canlı klasörde dosya doğrulanamadı: ${file}" >&2
    exit 1
  fi
done

printf 'Canpolat Nakliyat başarıyla yayınlandı: %s\n' "${DEPLOY_PATH}"
