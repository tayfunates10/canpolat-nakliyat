#!/usr/bin/env python3
"""Hero sahnesini parçalardan yeniden üretir.

Çıktılar:
    assets/images/hero-canpolat.webp        1600 x 900  (masaüstü, 16:9)
    assets/images/hero-canpolat-mobil.webp  1000 x 789  (tablet + mobil, dar çerçeve)

Parçalar `parts/` klasöründedir; hepsi kaynak fotoğraflardan kesilmiş
şeffaf WebP dosyalarıdır. `base.webp` kamyon + taş zemin + bulut katmanıdır
ve arka planı site rengine (#06121b) eşitlenmiştir.

Kullanım:
    python3 tools/hero/compose.py
"""
import os
from PIL import Image, ImageDraw, ImageFilter
from route_draw import draw_route

HERE = os.path.dirname(os.path.abspath(__file__))
PARTS = os.path.join(HERE, 'parts')
OUT = os.path.abspath(os.path.join(HERE, '..', '..', 'assets', 'images'))

base = Image.open(os.path.join(PARTS, 'base.webp')).convert('RGB')
W, H = base.size
canvas = base.copy()

# --------------------------------------------------------------------------
# Taş platformun ön kenarı — parçalar bu eğriye oturur
# --------------------------------------------------------------------------
GX = list(range(400, 1680, 40))
GY_RAW = [745, 770, 787, 798, 806, 812, 819, 836, 850, 849, 848, 861, 875, 879,
          883, 888, 893, 887, 881, 892, 903, 897, 890, 884, 877, 876, 876, 875,
          874, 872, 871, 870]


def smooth(vals, k=3):
    return [sum(vals[max(0, i - k):min(len(vals), i + k + 1)]) /
            len(vals[max(0, i - k):min(len(vals), i + k + 1)])
            for i in range(len(vals))]


GY = smooth(GY_RAW)


def ground_y(x):
    """x sütununda platformun ön kenarının y değeri (doğrusal interpolasyon)."""
    if x <= GX[0]:
        return GY[0]
    if x >= GX[-1]:
        return GY[-1]
    for i in range(len(GX) - 1):
        if GX[i] <= x <= GX[i + 1]:
            t = (x - GX[i]) / (GX[i + 1] - GX[i])
            return GY[i] + t * (GY[i + 1] - GY[i])
    return GY[-1]


def contact_shadow(w, h, alpha):
    sh = Image.new('L', (w, max(10, h)), 0)
    ImageDraw.Draw(sh).ellipse([0, 0, w - 1, sh.height - 1], fill=alpha)
    return sh.filter(ImageFilter.GaussianBlur(max(5, w * 0.05)))


def cool(im, mul=(0.98, 0.99, 1.05)):
    """Sıcak ışıklı parçaları kamyon sahnesinin soğuk tonuna yaklaştırır."""
    r, g, b, a = im.split()
    return Image.merge('RGBA', (
        r.point(lambda v: min(255, int(v * mul[0]))),
        g.point(lambda v: min(255, int(v * mul[1]))),
        b.point(lambda v: min(255, int(v * mul[2]))), a))


def place(name, x, depth=0, scale=1.0, flip=False, shadow_w=0.8, shadow_a=125):
    """Parçayı, tabanı zemin eğrisinin `depth` piksel üstünde olacak şekilde koyar."""
    im = Image.open(os.path.join(PARTS, f'{name}.webp')).convert('RGBA')
    im = im.crop(im.getbbox())
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    nw, nh = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    im = cool(im.resize((nw, nh), Image.LANCZOS))

    base_y = round(ground_y(x) - depth)
    sw = round(nw * shadow_w)
    sh = contact_shadow(sw, round(nh * 0.20), shadow_a)
    canvas.paste(Image.new('RGB', sh.size, (2, 7, 11)),
                 (round(x - sw / 2), round(base_y - sh.height * 0.6)), sh)
    canvas.paste(im, (round(x - nw / 2), base_y - nh), im)


def paste_route():
    """Dekoratif turuncu rota + konum işareti (arkada, metni kapatmaz)."""
    ctrl = [(52, 402), (170, 438), (300, 372), (392, 286), (498, 232), (612, 262)]
    glow, line = draw_route((W, H), ctrl, (392, 250))
    canvas.paste(Image.alpha_composite(Image.new('RGBA', (W, H), (0, 0, 0, 0)), glow)
                 .convert('RGB'), (0, 0), glow.getchannel('A'))
    canvas.paste(line.convert('RGB'), (0, 0), line.getchannel('A'))


def build(with_route):
    """Sahneyi kurar. Mobil sürümde rota yoktur (kadraj dışında kalır)."""
    global canvas
    canvas = base.copy()
    if with_route:
        paste_route()
    place('lift',    578, depth=56, scale=0.90, flip=True, shadow_w=0.45, shadow_a=85)
    place('w_hand',  640, depth=6,  scale=1.06, shadow_a=120)
    place('w_pack',  880, depth=10, scale=1.00, shadow_a=115)
    place('w_boxes', 1030, depth=18, scale=0.88, shadow_a=105)
    place('s_left',  1195, depth=12, scale=0.40, shadow_a=110)
    place('s_sofa',  1400, depth=20, scale=0.48, shadow_a=118)
    return canvas


# Masaüstü: 16:9 tam sahne
desktop = build(with_route=True).resize((1600, 900), Image.LANCZOS)
desktop.save(os.path.join(OUT, 'hero-canpolat.webp'), quality=92, method=6)

# Tablet + mobil: soldaki boşluk kırpılmış dar çerçeve, rota yok
mobile = build(with_route=False).crop((480, 0, W, H))
mobile = mobile.resize((1000, round(1000 * mobile.height / mobile.width)), Image.LANCZOS)
mobile.save(os.path.join(OUT, 'hero-canpolat-mobil.webp'), quality=92, method=6)

print('hero-canpolat.webp', desktop.size)
print('hero-canpolat-mobil.webp', mobile.size)
