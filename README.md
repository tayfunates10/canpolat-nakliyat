# Canpolat Nakliyat — Kurumsal Web Sitesi

`reference.png` görselindeki masaüstü ve mobil tasarımın **HTML5 + CSS3 + Vanilla JavaScript** ile
yeniden üretilmiş halidir. Framework, UI kütüphanesi veya hazır tema kullanılmamıştır.

---

## 1. Proje nasıl çalıştırılır?

Statik bir sitedir; herhangi bir derleme adımı yoktur.

```bash
# Depo klasöründe
npm run serve          # python3 -m http.server 8099
```

Ardından tarayıcıdan `http://localhost:8099` adresini açın.
Alternatif olarak `index.html` dosyasını doğrudan tarayıcıda da açabilirsiniz.

Basit bir HTML denetimi için:

```bash
npm test
```

---

## 2. Dosya yapısı

| Yol | Açıklama |
| --- | --- |
| `index.html` | **Ana HTML dosyası** — tüm bölümler, SEO etiketleri ve JSON-LD burada |
| `css/style.css` | **Tüm stiller** (bölümlere ayrılmış, yorumlanmış, responsive) |
| `js/script.js` | **Tüm JavaScript** (menü, accordion, form, yardımcı davranışlar) |
| `assets/images/` | Site görselleri (logo, hero, hizmetler, hakkımızda) |
| `assets/icons/` | Ek ikon dosyaları için ayrılmış klasör (ikonlar HTML içinde inline SVG'dir) |
| `screenshots/` | 1440 / 768 / 390 px ekran görüntüleri |
| `tools/hero/` | Hero sahnesinin parçaları ve birleştirme betiği |
| `reference.png` | Referans tasarım görseli (siteye dahil değildir) |

> Not: `hizmetler/`, `bolgeler/`, `hakkimizda.html`, `gizlilik.html` ve `404.html` daha önceki
> sürümden gelen ek sayfalardır; bu çalışma ana sayfayı (`index.html`) kapsar.

---

## 3. Görseller nereye eklenir?

Tüm görseller `assets/images/` klasörüne, **aşağıdaki dosya adlarıyla** eklenmelidir.
Dosya adları değiştirilmemelidir; görseller eklendiğinde HTML/CSS'te hiçbir değişiklik yapmadan
otomatik olarak görünür.

| Dosya adı | Kullanıldığı yer | Önerilen ölçü |
| --- | --- | --- |
| `logo-canpolat.png` | Header, mobil menü, footer, favicon | 230 × 58 px (şeffaf PNG) |
| ~~`hero-canpolat.png`~~ | Hero görseli **hazır** — bkz. aşağıdaki not | — |
| `service-evden-eve.png` | Hizmet kartı 1 | 420 × 300 px |
| `service-sehirler-arasi.png` | Hizmet kartı 2 | 420 × 300 px |
| `service-ofis.png` | Hizmet kartı 3 | 420 × 300 px |
| `service-asansorlu.png` | Hizmet kartı 4 | 420 × 300 px |
| `service-paketleme.png` | Hizmet kartı 5 | 420 × 300 px |
| `about-canpolat.webp` | Hakkımızda bölümü | 720 × 340 px (yatay) |

### Hero görseli hazırdır

Hero sahnesi kaynak fotoğraflardan birleştirilerek üretildi ve depoda yer alıyor:

| Dosya | Ölçü | Kullanım |
| --- | --- | --- |
| `assets/images/hero-canpolat.webp` | 1600 × 900 | 992 px ve üzeri |
| `assets/images/hero-canpolat-mobil.webp` | 1000 × 789 | 991 px ve altı |

Arka planı site rengiyle (`#06121b`) aynıdır, bu yüzden şeffaflığa gerek yoktur.
Sahneyi yeniden üretmek veya bir parçanın yerini değiştirmek için:
`tools/hero/README.md`.

Görsel yokken (henüz eklenmemiş logo / hizmet / hakkımızda görselleri için):

- kırık görsel simgesi gösterilmez (`js/script.js` → `initImageFallback`),
- görsel alanının ölçüsü korunur, bölüm yüksekliği çökmez,
- görsel eklendiğinde layout kayması (layout shift) oluşmaz.

### Görselleri değiştirme

- **Logo:** `assets/images/logo-canpolat.png` dosyasını değiştirin. Ölçü: `css/style.css` → `.brand__img`.
- **Hero görseli:** `assets/images/hero-canpolat.webp` + `hero-canpolat-mobil.webp`.
  Sahneyi düzenlemek için `tools/hero/compose.py`; oran/yükseklik: `css/style.css` → `.hero__image`.
- **Hizmet görselleri:** yukarıdaki `service-*.png` dosyaları. Kart görsel oranı: `.service-card__media`.
- **Hakkımızda görseli:** `assets/images/about-canpolat.webp`. Oran / köşe yarıçapı: `.about__media`.

---

## 4. İletişim bilgileri nereden düzenlenir?

Tüm bilgiler `index.html` içinde düz metin olarak yer alır; arayıp değiştirmek yeterlidir.

| Bilgi | Aranacak değer | Geçtiği yerler |
| --- | --- | --- |
| Telefon (görünen) | `0 535 912 06 91` | Header, mobil menü, CTA, footer, WhatsApp bandı |
| Telefon (bağlantı) | `tel:+905359120691` | Aynı yerler |
| WhatsApp | `https://wa.me/905359120691` | Hero butonu, mobil menü, WhatsApp bandı |
| E-posta | `info@canpolatnakliyat.com` / `mailto:info@canpolatnakliyat.com` | Footer, JSON-LD |
| Adres | `Altınkum Mah. 108. Sk. No: 5` ve `Edremit / BALIKESİR` | Footer, JSON-LD |
| Web adresi | `https://www.canpolatnakliyat.com` | Canonical, Open Graph, footer, JSON-LD |
| Çalışma saatleri | Footer `ÇALIŞMA SAATLERİ` sütunu | Footer, JSON-LD |

> Telefon numarasını değiştirirken hem görünen metni hem `tel:` / `wa.me` bağlantılarını
> hem de sayfa başındaki JSON-LD alanını güncelleyin.

---

## 5. Form endpoint'i nasıl bağlanır?

`js/script.js` dosyasının başındaki tek satır düzenlenir:

```js
var FORM_ENDPOINT = '';   // boş → demo mod
```

- **Boş bırakılırsa:** form gönderilmez, alanlar doğrulanır ve erişilebilir bir demo başarı mesajı gösterilir.
- **Doldurulursa:** form alanları JSON olarak `POST` edilir; başarıda başarı mesajı gösterilir, hatada
  telefon numarasını içeren bir hata mesajı görünür.

Zorunlu alanlar: Ad Soyad, Telefon, Nereden, Nereye, Taşınma Tarihi.
E-posta yalnızca doldurulmuşsa format kontrolünden geçer. Telefon, temel Türkiye formatına göre doğrulanır.

---

## 6. Sosyal medya linkleri nereden değiştirilir?

`index.html` → footer içindeki `<ul class="social">` listesi. Her bağlantıda şu an `href="#"` ve
`data-noop` niteliği bulunur; gerçek adres eklenirken **`data-noop` niteliğini kaldırın**:

```html
<li><a class="social__link" href="https://instagram.com/kullanici" aria-label="Instagram sayfamız"> … </a></li>
```

`data-noop`, adresi henüz belli olmayan bağlantıların tıklanınca sayfayı başa döndürmesini engeller.

---

## 7. Teknik notlar

- **Bölüm sırası:** Header → Hero → Hizmetler → Hakkımızda → Taşıma Süreci → SSS + Form → Turuncu CTA → Footer
- **Kırılımlar:** 1200+ / 992–1199 / 768–991 (tablet) / ≤767 (mobil) / ≤430 (küçük mobil)
- **İkonlar:** Tümü `index.html` başındaki inline SVG `<symbol>` setinden `<use>` ile çağrılır.
- **Erişilebilirlik:** İçeriğe geç bağlantısı, gerçek `<label>`ler, `aria-expanded` / `aria-controls`,
  odak tuzağı, `role="alert"` / `role="status"`, görünür odak halkaları.
- **Performans:** Hero görseli `preload` + `fetchpriority="high"` (kırılıma göre `media` ile),
  diğer görseller `loading="lazy"`,
  tüm görsellerde `width`/`height` ve `aspect-ratio`, `defer` ile tek JS dosyası, harici bağımlılık yok.
- **Hareket azaltma:** `prefers-reduced-motion: reduce` desteklenir.
- **Renkler:** `css/style.css` başındaki `:root` değişkenlerinden yönetilir.
