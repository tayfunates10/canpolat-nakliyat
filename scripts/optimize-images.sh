#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v convert >/dev/null 2>&1 || ! command -v compare >/dev/null 2>&1; then
  echo "HATA: Görsel türevleri için ImageMagick convert ve compare gereklidir." >&2
  exit 1
fi

hero_files=(
  "platform-p00-r8-reference-exact"
  "truck-t00-r6"
  "layer-l01-r6"
  "layer-l02-r6"
  "layer-l03-r6"
  "layer-l04-r6"
  "layer-l05-r6"
  "layer-l06-r6"
  "layer-l07-r6"
  "layer-l08-r6"
  "layer-l09-r6"
  "layer-l10-r6"
  "layer-l11-r6"
)

for base in "${hero_files[@]}"; do
  source_file="${REPO_ROOT}/assets/images/hero-r8/${base}.png"
  output_file="${REPO_ROOT}/assets/images/hero-r8/${base}.webp"
  convert "${source_file}" -define webp:lossless=true -define webp:method=6 "${output_file}"
  absolute_error="$(compare -metric AE "${source_file}" "${output_file}" null: 2>&1 || true)"
  if [[ "${absolute_error}" != "0" ]]; then
    echo "HATA: Hero türevi piksel-eş değil: ${base}.webp (AE=${absolute_error})" >&2
    exit 1
  fi

  for width in 768 1152; do
    height="$((width * 2 / 3))"
    responsive_file="${REPO_ROOT}/assets/images/hero-r8/${base}-${width}.webp"
    convert "${source_file}" -resize "${width}x${height}!" -strip -quality 90 \
      -define webp:method=6 -define webp:alpha-quality=100 "${responsive_file}"
    responsive_width="$(identify -format '%w' "${responsive_file}")"
    responsive_height="$(identify -format '%h' "${responsive_file}")"
    if [[ "${responsive_width}" != "${width}" || "${responsive_height}" != "${height}" ]]; then
      echo "HATA: Responsive Hero ölçüsü yanlış: ${base}-${width}.webp" >&2
      exit 1
    fi
    psnr="$(compare -metric PSNR \( "${source_file}" -resize "${width}x${height}!" \) "${responsive_file}" null: 2>&1 || true)"
    psnr_value="${psnr%% *}"
    if ! awk -v value="${psnr_value}" 'BEGIN { exit !(value >= 38) }'; then
      echo "HATA: Responsive Hero kalite eşiğinin altında: ${base}-${width}.webp (PSNR=${psnr_value})" >&2
      exit 1
    fi
  done
done

service_files=(
  "service-evden-eve"
  "service-sehirler-arasi"
  "service-ofis"
  "service-asansorlu"
  "service-paketleme"
)

mkdir -p "${REPO_ROOT}/assets/images/services"

for base in "${service_files[@]}"; do
  source_file="${REPO_ROOT}/source-assets/services/${base}.png"
  for width in 480 800 1200; do
    output_file="${REPO_ROOT}/assets/images/services/${base}-${width}.webp"
    convert "${source_file}" -resize "${width}x" -strip -quality 82 -define webp:method=6 "${output_file}"
    actual_width="$(identify -format '%w' "${output_file}")"
    if [[ "${actual_width}" != "${width}" ]]; then
      echo "HATA: Responsive hizmet görseli ölçüsü yanlış: ${base}-${width}.webp" >&2
      exit 1
    fi
    psnr="$(compare -metric PSNR \( "${source_file}" -resize "${width}x" \) "${output_file}" null: 2>&1 || true)"
    psnr_value="${psnr%% *}"
    if ! awk -v value="${psnr_value}" 'BEGIN { exit !(value >= 30) }'; then
      echo "HATA: Responsive hizmet görseli kalite eşiğinin altında: ${base}-${width}.webp (PSNR=${psnr_value})" >&2
      exit 1
    fi
  done
done

printf '13/13 tam Hero WebP piksel-eş; 26/26 responsive Hero PSNR >= 38; 15/15 hizmet türevi PSNR >= 30 doğrulandı.\n'
