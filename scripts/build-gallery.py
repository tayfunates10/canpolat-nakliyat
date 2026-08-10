#!/usr/bin/env python3
"""Galeri karelerini üretir.

Kaynak fotoğraflar source-assets/galeri/ altında saklanır; bu betik her kareyi
4/3 kadraja alır, markalı alt bandı (source-assets/galeri/band/band.png)
görselin içine işler ve assets/images/galeri/ altına iki genişlikte WebP yazar.

Bandı yeniden çizmek gerekirse band/band.html dosyası 1200x78 CSS ölçüsünde,
deviceScaleFactor 2 ile ekran görüntüsüne alınır ve band.png üzerine yazılır.

Kullanım: python3 scripts/build-gallery.py
Gerekli: Pillow
"""
import os

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "source-assets", "galeri")
OUT = os.path.join(ROOT, "assets", "images", "galeri")

WIDE, PHOTO_H, BAND_H = 2400, 1644, 156      # 2x çalışma tuvali; toplam 2400x1800 = 4/3
LARGE, SMALL = (1000, 750), (640, 480)
LARGE_BUDGET, SMALL_BUDGET = 150 * 1024, 70 * 1024

# Dikey kadraj çıpası: 0 üstü, 1 altı korur. Dikey telefon karelerinde 4/3'e
# inerken hangi bandın kalacağını belirler, her kare için ayrı seçilmiştir.
PHOTOS = [
    ("asansorlu-tasima-edremit", 0.45),
    ("kamyona-esya-yukleme", 0.45),
    ("sehirler-arasi-nakliyat-istanbul", 0.55),
    ("paketlenmis-esyalar-tasimaya-hazir", 0.55),
    ("evden-eve-nakliyat-araci-edremit", 0.45),
    ("kamyon-ici-esya-istifleme", 0.50),
    ("apartman-onunde-yukleme", 0.65),
    ("salon-koltuk-takimi-paketleme", 0.55),
    ("yuksek-kata-tasima-hazirligi", 0.50),
    ("yatak-koruyucu-kilif-paketleme", 0.45),
    ("kapali-kasa-nakliyat-kamyonu", 0.50),
    ("koltuk-koruyucu-kilif-sarim", 0.50),
    ("gece-tasima-hizmeti", 0.40),
    ("kusakli-mobilya-sabitleme", 0.66),
    ("yagmurda-nakliyat-tasima", 0.60),
    ("baza-yatak-koruma-ortusu", 0.60),
]


def encode(image, dest, budget):
    """Sayfa ağırlığı öngörülebilir kalsın diye kaliteyi bütçeye göre düşürür;
    yoğun kumaş desenlerinde bit tüketen sensör gürültüsünü gerekirse ölçülü
    bir yumuşatmayla alır."""
    for blur in (0, 0.5, 0.9):
        source = image.filter(ImageFilter.GaussianBlur(blur)) if blur else image
        for quality in (78, 74, 70, 66, 62):
            source.save(dest, "WEBP", quality=quality, method=6)
            if os.path.getsize(dest) <= budget:
                return
    print(f"  UYARI: {os.path.basename(dest)} bütçenin üzerinde kaldı.")


def main():
    os.makedirs(OUT, exist_ok=True)
    band = Image.open(os.path.join(SOURCE, "band", "band.png")).convert("RGB")
    if band.size != (WIDE, BAND_H):
        raise SystemExit(f"Alt bant ölçüsü {WIDE}x{BAND_H} olmalı, bulunan {band.size}.")

    ratio = WIDE / PHOTO_H
    for name, anchor in PHOTOS:
        path = os.path.join(SOURCE, name + ".jpg")
        if not os.path.exists(path):
            raise SystemExit(f"Kaynak fotoğraf eksik: {path}")

        image = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
        width, height = image.size
        if width / height > ratio:
            box_w, box_h = int(round(height * ratio)), height
            left, top = (width - box_w) // 2, 0
        else:
            box_w, box_h = width, int(round(width / ratio))
            left, top = 0, int(round((height - box_h) * anchor))

        photo = image.crop((left, top, left + box_w, top + box_h)).resize((WIDE, PHOTO_H), Image.LANCZOS)
        # Telefon kareleri için ölçülü bir canlandırma; rengi kaydırmayacak kadar hafif.
        photo = ImageEnhance.Color(ImageEnhance.Contrast(photo).enhance(1.06)).enhance(1.05)
        photo = ImageEnhance.Sharpness(photo).enhance(1.12)

        canvas = Image.new("RGB", (WIDE, PHOTO_H + BAND_H), "#1a2439")
        canvas.paste(photo, (0, 0))
        canvas.paste(band, (0, PHOTO_H))

        encode(canvas.resize(LARGE, Image.LANCZOS), os.path.join(OUT, name + ".webp"), LARGE_BUDGET)
        encode(canvas.resize(SMALL, Image.LANCZOS), os.path.join(OUT, name + "-640.webp"), SMALL_BUDGET)
        print(f"{name}: {os.path.getsize(os.path.join(OUT, name + '.webp')) // 1024} KB / "
              f"{os.path.getsize(os.path.join(OUT, name + '-640.webp')) // 1024} KB")

    print(f"{len(PHOTOS)} galeri karesi üretildi: {OUT}")


if __name__ == "__main__":
    main()
