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

---

## 8. `main` dalından otomatik FTP dağıtımı

`.github/workflows/deploy-ftp.yml` iş akışı, `main` dalına gelen her push sonrasında siteyi
otomatik olarak test eder, yayın paketini hazırlar ve FTP/FTPS ile canlı siteye senkronlar.
Workflow dosyası varsayılan dalda bulunduğunda GitHub **Actions** ekranındaki `Run workflow`
düğmesiyle elle de çalıştırılabilir.

### cPanel'de FTP hesabını hazırlama

Dağıtım için yalnız bu siteye ait ayrı bir FTP hesabı kullanın. cPanel'de FTP hesabını
oluştururken **Directory** alanını `public_html/canpolatnakliyat.com` olarak ayarlayın. cPanel bu
yolu `/home/<cpanel-kullanıcısı>/public_html/canpolatnakliyat.com` biçiminde gösterebilir; FTP
hesabı açısından bu dizin `./` köküdür.

Directory alanını `public_html/canpolatnakliyat.com/admin` olarak ayarlamayın. Böyle bir hesapla
workflow başarılı görünse bile dosyalar canlı site kökü yerine `/admin` altına yüklenir. FTP
hesabını `public_html/canpolatnakliyat.com` dizinine bağlamak ve GitHub'da
`FTP_SERVER_DIR=./` kullanmak, canlıda doğrulanan kurulumdur.

### Bir defalık GitHub ayarları

GitHub deposunda **Settings → Secrets and variables → Actions** bölümünü açın.

**Repository secrets** altında şu üç gizli değeri oluşturun:

| Ad | Değer |
| --- | --- |
| `FTP_SERVER` | `ftp.avo.acb.mytemp.website` (başına `ftp://` yazılmaz) |
| `FTP_USERNAME` | cPanel'de tanımlı FTP kullanıcı adı |
| `FTP_PASSWORD` | FTP hesabının parolası |

**Repository variables** altında şu değerleri oluşturun:

| Ad | Gerekli değer | Açıklama |
| --- | --- | --- |
| `FTP_SERVER_DIR` | `./` | FTP hesabı zaten `public_html/canpolatnakliyat.com` canlı site köküne bağlıdır |
| `FTP_PROTOCOL` | `ftps` | Önerilen güvenli bağlantı. Sunucu yalnız düz FTP destekliyorsa `ftp` yazılır |
| `FTP_PORT` | `21` | Hosting farklı bir FTP portu vermediyse `21` |

Parola veya kullanıcı adı hiçbir zaman workflow/README dosyasına yazılmaz. Yalnızca GitHub
Secrets içinde tutulur. `FTP_SERVER_DIR` güvenlik kontrolü nedeniyle yalnızca Canpolat alan adı
FTP hesabının canlı site kökü olan `./` değerini kabul eder. Böylece dosyalar yanlışlıkla
`public_html/canpolatnakliyat.com/public_html/canpolatnakliyat.com` gibi iç içe bir klasöre
yüklenmez.

### İş akışının çalışma sırası

1. `main` dalına push yapıldığında veya **Actions → Canpolat Nakliyat FTP Deploy → Run workflow**
   seçildiğinde dağıtım başlar.
2. Depo kaynakları alınır ve `npm test` ile site denetimleri çalıştırılır. Testlerden biri
   başarısız olursa FTP bağlantısı kurulmadan işlem durur.
3. `scripts/prepare-deploy.sh`, yalnız canlıda bulunması gereken dosyaları geçici yayın paketine
   kopyalar ve zorunlu dosyaların eksik ya da boş olmadığını denetler.
4. `scripts/validate-ftp-config.sh`, gerekli Secret değerlerini, FTP portunu/protokolünü ve hedefin
   tam olarak `./` olduğunu doğrular.
5. Paket FTPS üzerinden FTP hesabının köküne, yani doğrudan
   `public_html/canpolatnakliyat.com` dizinine senkronlanır.
6. Sunucudaki `.canpolat-ftp-deploy-state.json` dosyası sonraki çalıştırmalarda yalnız değişen
   dosyaların aktarılmasını sağlar.

### İlk çalıştırma ve kontrol

1. Yukarıdaki secret ve variable değerlerini kaydedin.
2. `main` dalına bir commit gönderin; ilk dağıtım otomatik olarak başlar.
3. Sırasıyla `Site denetimlerini çalıştır`, `FTP yayın paketini hazırla` ve
   `Siteyi FTP ile canlıya dağıt` adımlarının yeşil olduğunu doğrulayın.
4. `https://www.canpolatnakliyat.com` adresini gizli sekmede açarak son değişikliği kontrol edin.

İlk başarılı yayından sonra aynı iş akışı her `main` push'unda yalnızca değişen dosyaları
senkronlar. Eşzamanlı yayınlar sıraya alınır; yarım kalmış iki dağıtım aynı anda çalışmaz.

### Canlı FTP kökünü eski dosyalardan temizleme

Normal dağıtım, yalnız daha önce workflow tarafından izlenen dosyaları günceller veya kaldırır.
Sunucuya eski yöntemlerle yüklenmiş izlenmeyen dosyaları temizlemek için **Actions → Canpolat
Nakliyat FTP Deploy → Run workflow** ekranında `clean_live_root` seçeneğini işaretleyin. Bu işlem,
GitHub yayın paketinde bulunmayan eski site dosyalarını siler ve ardından güncel paketi yeniden
senkronlar.

Temizlik sırasında `.well-known`, `cgi-bin`, `.user.ini`, `php.ini`, `.ftpquota`, `error_log` ve
`.canpolat-ftp-deploy-state.json` korunur. `dangerous-clean-slate` kullanılmaz; çünkü bu seçenek
hariç tutulan cPanel/SSL dosyalarını da geri dönüşsüz olarak siler.

### Yayınlanan ve korunan dosyalar

- Site statiktir; ayrıca bir build komutu yoktur. `npm test` başarısız olursa FTP yüklemesi başlamaz.
- `scripts/prepare-deploy.sh`, yalnız canlı site için gereken HTML/PHP, CSS, JavaScript, görsel,
  `.htaccess`, sitemap ve manifest dosyalarını geçici bir klasöre hazırlar.
- Eski hero dosyaları paketten çıkarılır; `assets/images/hero-animated/` altındaki güncel animasyon
  parçaları doğrudan pakete alınır ve zorunlu dosyaların boş olmadığı doğrulanır.
- `cgi-bin` ve `.well-known` FTP senkronunun dışında tutulur. `dangerous-clean-slate` kapalıdır.
- GoDaddy paylaşımlı sunucusu `ftp.avo.acb.mytemp.website` adıyla uyuşmayan ortak bir FTPS
  sertifikası sunduğu için bağlantıda `security: loose` kullanılır. Veri aktarımı FTPS ile şifreli
  kalır; yalnız sertifikanın hostname eşleşmesi aranmaz. İleride sertifikayla eşleşen gerçek
  `*.prod.sxb1.secureserver.net` sunucu adı alınırsa ayar yeniden `strict` yapılmalıdır.
- `.canpolat-ftp-deploy-state.json`, bir sonraki çalıştırmada yalnız değişen dosyaları belirlemek
  için sunucuda otomatik oluşturulan senkron durum dosyasıdır; silinmemelidir.
- Mevcut `.cpanel.yml` elle cPanel dağıtımı için çalışmaya devam eder ve FTP akışıyla aynı yayın
  paketi hazırlama betiğini kullanır.
