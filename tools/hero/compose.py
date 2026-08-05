#!/usr/bin/env python3
"""Hero sahnesini parçalardan yeniden üretir.

Sahne, kamyon fotoğrafının taş platformu üzerine kurulur; tüm parçalar
platformun ön kenarından ölçülen zemin eğrisine oturur. Yerleşim
`reference.png` içindeki hero düzeni esas alınarak belirlenmiştir.

Çıktılar:
    assets/images/hero-canpolat.webp        1600 x 900  (992 px ve üzeri, 16:9)
    assets/images/hero-canpolat-mobil.webp  1000 x 786  (991 px ve altı, dar çerçeve)

Kullanım:
    python3 tools/hero/compose.py
"""
import os
from PIL import Image, ImageDraw, ImageFilter
from route_draw import catmull, dashes, draw_pin

HERE = os.path.dirname(os.path.abspath(__file__))
PARTS = os.path.join(HERE, 'parts')
OUT = os.path.abspath(os.path.join(HERE, '..', '..', 'assets', 'images'))

ORANGE = (255, 106, 12)

# Kamyon + taş platform + bulut katmanı; arka planı site rengine eşitlenmiş
base = Image.open(os.path.join(PARTS, 'base.webp')).convert('RGB')
W, H = base.size          # 1536 x 1024
canvas = base.copy()

# Masaüstü ve mobil kadrajlar (base üzerinden)
CROP_DESKTOP = (150, 140, 1536, 920)   # 1386 x 780  -> 16:9
CROP_MOBILE = (255, 95, 1470, 1000)    # 1215 x 905  -> dar çerçeve

# --------------------------------------------------------------------------
# Platformun ön kenarı — parçalar bu eğriye oturur (base koordinatları)
# --------------------------------------------------------------------------
GX = [x + 150 for x in range(0, 1400, 40)]
GY = [y + 140 for y in
      [686, 698, 690, 705, 718, 726, 728, 733, 745, 753, 760, 764, 768, 769,
       774, 777, 778, 778, 774, 771, 776, 774, 768, 768, 758, 759, 755, 749,
       738, 729, 722, 713, 700, 688, 670]]


def ground_y(x):
    """x sütununda platformun ön kenarının y değeri."""
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
    sh = Image.new('L', (w, max(8, h)), 0)
    ImageDraw.Draw(sh).ellipse([0, 0, w - 1, sh.height - 1], fill=alpha)
    return sh.filter(ImageFilter.GaussianBlur(max(4, w * 0.045)))


def place(name, x, depth, scale, flip=False, shadow_w=0.78, shadow_a=110):
    """Parçayı, tabanı zemin eğrisinin `depth` piksel üstünde olacak şekilde koyar.

    Kenarlar keskin kalır: maske yumuşatması yapılmaz, küçültme sonrası
    unsharp ile netlik geri verilir.
    """
    im = Image.open(os.path.join(PARTS, f'{name}.webp')).convert('RGBA')
    im = im.crop(im.getbbox())
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)

    nw, nh = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    im = im.resize((nw, nh), Image.LANCZOS)
    if scale < 0.95:
        rgb = Image.merge('RGB', im.split()[:3]).filter(
            ImageFilter.UnsharpMask(radius=1.1, percent=70, threshold=2))
        im = Image.merge('RGBA', (*rgb.split(), im.split()[3]))

    by = round(ground_y(x) - depth)
    sw = round(nw * shadow_w)
    sh = contact_shadow(sw, round(nh * 0.16), shadow_a)
    canvas.paste(Image.new('RGB', sh.size, (2, 7, 11)),
                 (round(x - sw / 2), round(by - sh.height * 0.55)), sh)
    canvas.paste(im, (round(x - nw / 2), by - nh), im)


def paste_route():
    """Dekoratif turuncu rota + konum işareti (kaynak görseldeki şekil)."""
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    ctrl = [(750, 192), (620, 180), (500, 218), (412, 268), (358, 350),
            (364, 440), (418, 496), (490, 512)]
    for seg in dashes(catmull(ctrl), dash=15, gap=12):
        d.line(seg, fill=ORANGE + (240,), width=4, joint='curve')
    draw_pin(d, 408, 260, r=17, color=ORANGE, hole=(6, 20, 30))

    glow = layer.filter(ImageFilter.GaussianBlur(15))
    glow.putalpha(glow.getchannel('A').point(lambda v: int(v * 0.5)))
    canvas.paste(Image.alpha_composite(Image.new('RGBA', (W, H), (0, 0, 0, 0)), glow)
                 .convert('RGB'), (0, 0), glow.getchannel('A'))
    canvas.paste(layer.convert('RGB'), (0, 0), layer.getchannel('A'))


def build(with_route=True):
    """Sahneyi arkadan öne doğru kurar."""
    global canvas
    canvas = base.copy()
    if with_route:
        paste_route()
    place('plant',     1495, depth=125, scale=0.58, shadow_a=70)   # arkadaki bitki
    place('lift',      1430, depth=100, scale=0.84, shadow_w=0.5, shadow_a=80)
    place('grp_right', 1318, depth=88,  scale=0.54, shadow_a=100)  # sağ ekip + koliler
    place('grp_left',  328,  depth=92,  scale=0.73, shadow_a=105)  # sol ekip + el arabası
    place('stack',     510,  depth=74,  scale=0.34, shadow_a=100)  # streçli eşya + koli
    place('wrapped',   988,  depth=56,  scale=0.42, shadow_a=105)  # streçli koltuk
    place('sofa',      1130, depth=48,  scale=0.50, shadow_a=112)  # mavi koltuk
    place('boxes_sm',  850,  depth=22,  scale=0.40, shadow_a=105)  # öndeki koliler
    return canvas


# Masaüstü: 16:9 geniş sahne, rota dahil
desktop = build(True).crop(CROP_DESKTOP).resize((1600, 900), Image.LANCZOS)
desktop.save(os.path.join(OUT, 'hero-canpolat.webp'), quality=93, method=6)

# Tablet + mobil: dar çerçeve, rota kadraj dışında
mobile = build(False).crop(CROP_MOBILE)
mobile = mobile.resize((1000, round(1000 * mobile.height / mobile.width)), Image.LANCZOS)
mobile.save(os.path.join(OUT, 'hero-canpolat-mobil.webp'), quality=93, method=6)

print('hero-canpolat.webp', desktop.size)
print('hero-canpolat-mobil.webp', mobile.size)
