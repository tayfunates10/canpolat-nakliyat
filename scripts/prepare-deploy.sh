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
  "assets/images/canpolat-opengraph-20260811.jpg"
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

# Lighthouse/SEOptimer raporlarında sayfa yükünün neredeyse tamamının büyük
# hizmet görsellerinden geldiği görülüyor. Kaynak dosyaları ve görünüm aynen
# korunur; production paketinde yalnız tarayıcının gerçek görüntüleme boyutuna
# uygun WebP türevleri üretilir. 1280px türev yüksek DPR ekranlarda da görsel
# kaliteyi korur.
responsive_stems=(
  "service-evden-eve"
  "service-sehirler-arasi"
  "service-ofis"
  "service-asansorlu"
  "service-paketleme"
  "about-tasima"
  "cta-kamyon"
)
responsive_widths=(640 960 1280)
optimized_dir="${OUTPUT_PATH}/assets/images/optimized"
mkdir -p "${optimized_dir}"

make_webp_variant() {
  local input="$1"
  local width="$2"
  local output="$3"
  rm -f "${output}"

  if command -v cwebp >/dev/null 2>&1; then
    if cwebp -quiet -q 86 -resize "${width}" 0 "${input}" -o "${output}" >/dev/null 2>&1 \
      && [[ -s "${output}" ]]; then
      echo "cwebp"
      return 0
    fi
    rm -f "${output}"
  fi

  if command -v magick >/dev/null 2>&1; then
    if magick "${input}" -auto-orient -strip -resize "${width}x>" -quality 86 -define webp:method=6 "${output}" >/dev/null 2>&1 \
      && [[ -s "${output}" ]]; then
      echo "magick"
      return 0
    fi
    rm -f "${output}"
  fi

  if command -v convert >/dev/null 2>&1; then
    if convert "${input}" -auto-orient -strip -resize "${width}x>" -quality 86 -define webp:method=6 "${output}" >/dev/null 2>&1 \
      && [[ -s "${output}" ]]; then
      echo "convert"
      return 0
    fi
    rm -f "${output}"
  fi

  if command -v ffmpeg >/dev/null 2>&1; then
    if ffmpeg -hide_banner -loglevel error -y \
      -i "${input}" \
      -vf "scale='min(${width},iw)':-2" \
      -frames:v 1 \
      -c:v libwebp \
      -q:v 86 \
      "${output}" >/dev/null 2>&1 \
      && [[ -s "${output}" ]]; then
      echo "ffmpeg"
      return 0
    fi
    rm -f "${output}"
  fi

  return 1
}

responsive_files=()
encoder_used=""
for stem in "${responsive_stems[@]}"; do
  input="${OUTPUT_PATH}/assets/images/${stem}.webp"
  if [[ ! -s "${input}" ]]; then
    echo "HATA: Responsive görsel kaynağı bulunamadı: ${input}" >&2
    exit 1
  fi

  for width in "${responsive_widths[@]}"; do
    output="${optimized_dir}/${stem}-${width}.webp"
    if ! encoder="$(make_webp_variant "${input}" "${width}" "${output}")"; then
      echo "HATA: Responsive WebP üretilemedi (${stem}, ${width}px); kullanılabilir encoder yok veya codec başarısız." >&2
      exit 1
    fi
    encoder_used="${encoder_used:-${encoder}}"
    responsive_files+=("assets/images/optimized/${stem}-${width}.webp")
  done
done
echo "Responsive WebP üretimi tamamlandı (encoder: ${encoder_used})."

# HTML'deki görünüm, width/height oranları, lazy-loading ve animasyonlar aynen
# kalır. Yalnız src/srcset/sizes üzerinden daha küçük dosya seçimi yapılır.
# Hero arka planı LCP kaynağı olduğundan yüksek öncelik alır; R8'in iki büyük
# preload'u yalnız masaüstünde etkinleştirilir. Böylece mobilde gecikmeli R8
# sahnesi ilk ekranın LCP kaynağıyla ağ önceliği için yarışmaz.
python3 - "${OUTPUT_PATH}" <<'PY'
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
og_url = 'https://www.canpolatnakliyat.com/assets/images/canpolat-opengraph-20260811.jpg'

responsive = {
    '/assets/images/service-evden-eve.webp': ('service-evden-eve', '(max-width: 720px) calc(100vw - 40px), (max-width: 1160px) 50vw, 40vw'),
    '/assets/images/service-sehirler-arasi.webp': ('service-sehirler-arasi', '(max-width: 720px) calc(100vw - 40px), (max-width: 1160px) 50vw, 40vw'),
    '/assets/images/service-ofis.webp': ('service-ofis', '(max-width: 720px) calc(100vw - 40px), (max-width: 1160px) 50vw, 34vw'),
    '/assets/images/service-asansorlu.webp': ('service-asansorlu', '(max-width: 720px) calc(100vw - 40px), (max-width: 1160px) 50vw, 34vw'),
    '/assets/images/service-paketleme.webp': ('service-paketleme', '(max-width: 720px) calc(100vw - 40px), (max-width: 1160px) 50vw, 34vw'),
    '/assets/images/about-tasima.webp': ('about-tasima', '(max-width: 960px) calc(100vw - 40px), 50vw'),
    '/assets/images/cta-kamyon.webp': ('cta-kamyon', '(max-width: 720px) 86vw, (max-width: 1160px) 52vw, 44vw'),
}

img_re = re.compile(r'<img\b[^>]*\bsrc="([^"]+)"[^>]*>', re.IGNORECASE)

def responsive_img(match):
    tag = match.group(0)
    raw_src = match.group(1)
    source_path = raw_src.split('?', 1)[0]
    config = responsive.get(source_path)
    if not config:
        return tag

    stem, sizes = config
    base = f'/assets/images/optimized/{stem}'
    src = f'{base}-1280.webp'
    srcset = f'{base}-640.webp 640w, {base}-960.webp 960w, {base}-1280.webp 1280w'
    tag = re.sub(r'\bsrc="[^"]+"', f'src="{src}"', tag, count=1, flags=re.IGNORECASE)
    if not re.search(r'\bsrcset=', tag, flags=re.IGNORECASE):
        tag = tag.replace(f'src="{src}"', f'src="{src}" srcset="{srcset}" sizes="{sizes}"', 1)
    return tag

for html_path in root.rglob('*.html'):
    source = html_path.read_text(encoding='utf-8')

    if 'property="og:image"' in source:
        source = re.sub(r'(<meta\s+property="og:image"\s+content=")[^"]*(")', lambda m: m.group(1) + og_url + m.group(2), source, count=1, flags=re.IGNORECASE)
        source = re.sub(r'(<meta\s+name="twitter:image"\s+content=")[^"]*(")', lambda m: m.group(1) + og_url + m.group(2), source, count=1, flags=re.IGNORECASE)
        source = re.sub(r'(<meta\s+property="og:image:width"\s+content=")[^"]*(")', lambda m: m.group(1) + '300' + m.group(2), source, count=1, flags=re.IGNORECASE)
        source = re.sub(r'(<meta\s+property="og:image:height"\s+content=")[^"]*(")', lambda m: m.group(1) + '200' + m.group(2), source, count=1, flags=re.IGNORECASE)
        source = re.sub(r'(<meta\s+property="og:image:alt"\s+content=")[^"]*(")', lambda m: m.group(1) + 'Canpolat Evden Eve Nakliyat - Edremit Balıkesir' + m.group(2), source, count=1, flags=re.IGNORECASE)

    source = img_re.sub(responsive_img, source)

    source = re.sub(
        r'(<link\s+rel="preload"\s+as="image"\s+href="/assets/images/hero/canpolat-hero-bg-2026\.webp\?v=20260809-02")(?![^>]*fetchpriority)',
        r'\1 fetchpriority="high"', source, count=1, flags=re.IGNORECASE)

    for r8_path in ('/assets/images/hero-r8/platform-p00-r8-reference-exact.png', '/assets/images/hero-r8/truck-t00-r6.png'):
        escaped = re.escape(r8_path)
        source = re.sub(
            rf'(<link\s+rel="preload"\s+as="image"\s+href="{escaped}"[^>]*)(?=>)',
            lambda m: m.group(1) if 'media=' in m.group(1) else m.group(1) + ' media="(min-width: 961px)"',
            source, count=1, flags=re.IGNORECASE)

    source = re.sub(
        r'(<img\b(?=[^>]*\bhero-r8__layer\b)[^>]*?)\s+fetchpriority="high"([^>]*>)',
        r'\1\2', source, flags=re.IGNORECASE)

    html_path.write_text(source, encoding='utf-8')
PY

rm -f \
  "${OUTPUT_PATH}/assets/images/hero-canpolat.webp" \
  "${OUTPUT_PATH}/assets/images/hero-canpolat-mobil.webp" \
  "${OUTPUT_PATH}/assets/images/hero-canpolat-final.webp" \
  "${OUTPUT_PATH}/assets/images/hero-layout.webp"
rm -rf "${OUTPUT_PATH}/assets/images/hero-parts"

required_output_files=(
  "${gallery_files[@]}"
  "${responsive_files[@]}"
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
  "assets/images/canpolat-opengraph-20260811.jpg"
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

for forbidden in "assets/images/hero-canpolat.webp" "assets/images/hero-canpolat-mobil.webp"; do
  if [[ -e "${OUTPUT_PATH}/${forbidden}" ]]; then
    echo "HATA: Eski hero production paketinde bulunmamalı: ${forbidden}" >&2
    exit 1
  fi
done

if grep -Eq 'hero__picture|hero-canpolat(-mobil)?\.webp' "${OUTPUT_PATH}/index.html"; then
  echo "HATA: Public index.html içinde eski hero izi bulundu." >&2
  exit 1
fi

if ! grep -q 'canpolat-opengraph-20260811.jpg' "${OUTPUT_PATH}/index-template.html"; then
  echo "HATA: Open Graph görseli production ana sayfasına uygulanamadı." >&2
  exit 1
fi

if ! grep -q 'assets/images/optimized/service-evden-eve-640.webp 640w' "${OUTPUT_PATH}/index-template.html"; then
  echo "HATA: Responsive hizmet görseli srcset production ana sayfasına uygulanamadı." >&2
  exit 1
fi

if ! grep -q 'canpolat-hero-bg-2026.webp?v=20260809-02" fetchpriority="high"' "${OUTPUT_PATH}/index-template.html"; then
  echo "HATA: Hero LCP preload yüksek önceliğe alınamadı." >&2
  exit 1
fi

if ! grep -Eq 'platform-p00-r8-reference-exact\.png"[^>]*fetchpriority="high"[^>]*media="\(min-width: 961px\)"' "${OUTPUT_PATH}/index-template.html"; then
  echo "HATA: R8 platform preload'u masaüstüyle sınırlandırılamadı." >&2
  exit 1
fi

printf 'Yayın paketi başarıyla hazırlandı: %s\n' "${OUTPUT_PATH}"
