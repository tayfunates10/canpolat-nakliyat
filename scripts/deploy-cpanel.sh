#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="${CPANEL_REPOSITORY_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
DEPLOY_PATH="${CANPOLAT_DEPLOY_PATH:-${HOME}/public_html/canpolatnakliyat.com}"
STAGING_PATH="$(mktemp -d "${TMPDIR:-/tmp}/canpolat-deploy.XXXXXX")"
PREPARE_SCRIPT="${REPO_ROOT}/scripts/prepare-deploy.sh"

case "${DEPLOY_PATH}" in
  */public_html/canpolatnakliyat.com)
    ;;
  *)
    echo "HATA: Güvenli olmayan cPanel yayın hedefi reddedildi: ${DEPLOY_PATH}" >&2
    exit 1
    ;;
esac

cleanup() {
  rm -rf "${STAGING_PATH}"
}
trap cleanup EXIT

mkdir -p "${DEPLOY_PATH}"

"${PREPARE_SCRIPT}" "${STAGING_PATH}"

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
