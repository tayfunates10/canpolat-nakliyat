"""Kaynak PNG'deki dekoratif rotayı temiz vektörel olarak yeniden çizer
(orijinal glow'lu gri arka planı kesmek yerine)."""
from PIL import Image, ImageDraw, ImageFilter
import math

ORANGE = (255, 106, 12)

def catmull(points, samples=40):
    """Kontrol noktalarından yumuşak eğri üretir."""
    pts = [points[0]] + list(points) + [points[-1]]
    out = []
    for i in range(len(pts) - 3):
        p0, p1, p2, p3 = pts[i], pts[i + 1], pts[i + 2], pts[i + 3]
        for s in range(samples):
            t = s / samples
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t +
                       (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                       (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t +
                       (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                       (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    out.append(points[-1])
    return out

def dashes(curve, dash=16, gap=13):
    """Eğriyi kesik çizgi parçalarına böler."""
    segs, cur, dist, drawing = [], [curve[0]], 0.0, True
    for a, b in zip(curve, curve[1:]):
        d = math.hypot(b[0] - a[0], b[1] - a[1])
        dist += d
        if drawing:
            cur.append(b)
            if dist >= dash:
                segs.append(cur); cur, dist, drawing = [b], 0.0, False
        elif dist >= gap:
            cur, dist, drawing = [b], 0.0, True
    if drawing and len(cur) > 1:
        segs.append(cur)
    return segs

def draw_pin(draw, x, y, r=17, color=ORANGE, hole=(6, 20, 30)):
    draw.ellipse([x - r, y - r, x + r, y + r], fill=color)
    draw.polygon([(x - r * 0.72, y + r * 0.62), (x + r * 0.72, y + r * 0.62),
                  (x, y + r * 2.35)], fill=color)
    draw.ellipse([x - r * 0.38, y - r * 0.38, x + r * 0.38, y + r * 0.38], fill=hole)

def draw_route(size, ctrl, pin_at, width=4):
    layer = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    curve = catmull(ctrl)
    for seg in dashes(curve):
        d.line(seg, fill=ORANGE + (235,), width=width, joint='curve')
    draw_pin(d, *pin_at)
    glow = layer.filter(ImageFilter.GaussianBlur(16))
    glow.putalpha(glow.getchannel('A').point(lambda v: int(v * 0.55)))
    return glow, layer
