# Hero sahnesi

Hero görseli tek bir fotoğraf değildir; dört kaynak görselden kesilen parçaların
tek sahnede birleştirilmesiyle üretilir. Parçalar `parts/` klasöründe şeffaf
WebP olarak durur, böylece sahne kaynak dosyalara ihtiyaç duymadan yeniden
kurulabilir.

## Üretim

```bash
cd tools/hero
python3 compose.py     # Pillow gerekir:  pip install pillow
```

Üretilen dosyalar:

| Dosya | Ölçü | Kullanım |
| --- | --- | --- |
| `assets/images/hero-canpolat.webp` | 1600 × 900 | 992 px ve üzeri (16:9 geniş sahne, rota dahil) |
| `assets/images/hero-canpolat-mobil.webp` | 1000 × 745 | 991 px ve altı (dar çerçeve, kamyon daha büyük) |

Her iki dosya da `index.html` içindeki `<picture>` etiketiyle seçilir.

## Parçalar

| Dosya | İçerik |
| --- | --- |
| `base.webp` | Kamyon + taş platform + bulutlar. Arka planı site rengine (`#06121b`) eşitlenmiştir. |
| `grp_left.webp` | Sol ekip: el arabalı işçi + koli paketleyen işçi + koliler |
| `grp_right.webp` | Sağ ekip: iki işçi + koli yığını + el arabası |
| `stack.webp` | Streçlenmiş eşyalar ve koliler |
| `wrapped.webp` | Streçlenmiş koltuk |
| `sofa.webp` | Mavi koltuk |
| `boxes_sm.webp` | Öndeki küçük koliler |
| `plant.webp` | Saksı bitkisi (arka plan) |
| `lift.webp` | İnsansız asansörlü taşıma aracı |

## Sahneyi değiştirme

`compose.py` içindeki `build()` fonksiyonunda her parça tek satırdır:

```python
place('s_sofa', 1400, depth=20, scale=0.48, shadow_a=118)
#      parça     x    zeminden  ölçek       temas gölgesi
#                     yükseklik              koyuluğu
```

- `x`: parçanın yatay merkezi (tuval 1672 px geniştir)
- `depth`: taban, platformun ön kenarının kaç piksel üstünde duracak
  (büyük değer = sahnede daha geride)
- `scale`: ölçek çarpanı
- `flip=True`: yatay çevirir

Parçaların tabanı `ground_y()` eğrisine oturur; bu eğri kamyon görselindeki taş
platformun ön kenarından ölçülmüştür, bu yüzden hiçbir parça havada kalmaz.

Kesim sırasında maske yumuşatması (`post_process_mask`) kullanılmaz; alfa kanalı
kontrast eğrisiyle ~1 piksellik geçişe indirilir ve küçültme sonrası unsharp
uygulanır. Böylece parçaların kenarları bulanıklaşmaz.

Dekoratif turuncu rota `route_draw.py` ile vektörel çizilir (kaynak görseldeki
bulutlu gri zemin kullanılmaz). Rota yalnızca masaüstü sürümünde yer alır.

## Yeni parça eklemek

Yeni bir fotoğraftan parça kesmek için arka plan kaldırma gerekir:

```bash
pip install rembg onnxruntime
python3 -c "
from rembg import remove, new_session
from PIL import Image
im = Image.open('kaynak.png').convert('RGB').crop((x0, y0, x1, y1))
remove(im, session=new_session('isnet-general-use')).save('parts/yeni.webp')  # yumuşatma yok
"
```

Sonra `compose.py` içindeki `build()` fonksiyonuna bir `place(...)` satırı ekleyin.
