#!/usr/bin/env bash
set -Eeuo pipefail

# Canpolat Nakliyat — cPanel güvenli yayın betiği
# Kaynak: bu Git deposunun kökü
# Hedef: canpolatnakliyat.com alan adının gerçek Document Root klasörü

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

# Önce geçici klasörde eksiksiz bir yayın paketi oluştur.
for path in "${publish_paths[@]}"; do
  cp -a "${REPO_ROOT}/${path}" "${STAGING_PATH}/"
done

# Katmanlı hero sahnesinin şeffaf WebP parçalarını yayın paketine ekle.
mkdir -p "${STAGING_PATH}/assets/images/hero-parts"
cp -a "${REPO_ROOT}/tools/hero/parts/." \
  "${STAGING_PATH}/assets/images/hero-parts/"

# Temel çıktı doğrulaması: eksik veya boş bir paket canlı siteyi değiştirmesin.
[[ -s "${STAGING_PATH}/index.php" ]] || {
  echo "HATA: index.php boş veya oluşturulamadı." >&2
  exit 1
}
[[ -s "${STAGING_PATH}/index.html" ]] || {
  echo "HATA: index.html boş veya oluşturulamadı." >&2
  exit 1
}
[[ -s "${STAGING_PATH}/css/style.css" ]] || {
  echo "HATA: css/style.css boş veya oluşturulamadı." >&2
  exit 1
}
[[ -s "${STAGING_PATH}/css/hero-fix.css" ]] || {
  echo "HATA: css/hero-fix.css boş veya oluşturulamadı." >&2
  exit 1
}
[[ -s "${STAGING_PATH}/js/script.js" ]] || {
  echo "HATA: js/script.js boş veya oluşturulamadı." >&2
  exit 1
}
[[ -s "${STAGING_PATH}/js/hero-fix.js" ]] || {
  echo "HATA: js/hero-fix.js boş veya oluşturulamadı." >&2
  exit 1
}
[[ -s "${STAGING_PATH}/assets/images/hero-parts/base-clean.webp" ]] || {
  echo "HATA: Temiz hero kamyon ve zemin görseli oluşturulamadı." >&2
  exit 1
}
[[ -s "${STAGING_PATH}/assets/images/hero-parts/grp_left.webp" ]] || {
  echo "HATA: Sol taşıma ekibi katmanı oluşturulamadı." >&2
  exit 1
}
[[ -s "${STAGING_PATH}/assets/images/hero-parts/grp_right.webp" ]] || {
  echo "HATA: Sağ taşıma ekibi katmanı oluşturulamadı." >&2
  exit 1
}
[[ -s "${STAGING_PATH}/assets/images/hero-parts/lift.webp" ]] || {
  echo "HATA: Hero asansör katmanı oluşturulamadı." >&2
  exit 1
}

# Hosting tarafından yönetilen klasörleri koru; önceki site dosyalarını temizle.
find "${DEPLOY_PATH}" -mindepth 1 -maxdepth 1 \
  ! -name 'cgi-bin' \
  ! -name '.well-known' \
  -exec rm -rf -- {} +

# Gizli dosyalar (.htaccess) dahil doğrulanmış paketi canlı klasöre aktar.
cp -a "${STAGING_PATH}/." "${DEPLOY_PATH}/"

# Dosya ve klasör izinlerini standart web barındırma değerlerine getir.
find "${DEPLOY_PATH}" -type d -exec chmod 755 {} +
find "${DEPLOY_PATH}" -type f -exec chmod 644 {} +

[[ -s "${DEPLOY_PATH}/index.php" ]] || {
  echo "HATA: Canlı klasörde index.php doğrulanamadı." >&2
  exit 1
}
[[ -s "${DEPLOY_PATH}/assets/images/hero-parts/base-clean.webp" ]] || {
  echo "HATA: Canlı klasörde temiz hero görseli doğrulanamadı." >&2
  exit 1
}
[[ -s "${DEPLOY_PATH}/assets/images/hero-parts/grp_left.webp" ]] || {
  echo "HATA: Canlı klasörde hero ekip katmanları doğrulanamadı." >&2
  exit 1
}

printf 'Canpolat Nakliyat başarıyla yayınlandı: %s\n' "${DEPLOY_PATH}"
