# Canpolat Nakliyat — Kurumsal Web Sitesi

Canpolat Evden Eve Nakliyat için HTML5, CSS ve bağımlılıksız JavaScript ile hazırlanmış statik/PHP girişli kurumsal sitedir. Ana sayfa `index.php` üzerinden `index-template.html` içeriğini sunar; alt sayfalar statik HTML’dir.

## Yerel geliştirme ve doğrulama

```bash
npm ci --ignore-scripts
npm run preview       # http://127.0.0.1:8099
npm run lint
npm run type-check
npm test
npm run build
```

`npm test`; üretilmiş sayfaları, JavaScript sözdizimini, kilitli tasarım görsellerini, metadata/H1/canonical benzersizliğini, sitemap’i, iç bağlantıları, JSON-LD parse’ını ve production preview üzerindeki HTTP 200/301/403/404/410 yanıtlarını denetler. `npm run build` aynı testleri çalıştırır ve geçici yayın paketini doğrular.

## URL yapısı

| URL | Kaynak | İndeks |
| --- | --- | --- |
| `/` | `index.php` + `index-template.html` | Evet |
| `/hizmetler/` | `hizmetler/index.html` | Evet |
| `/hizmetler/evden-eve-nakliyat.html` | Üretilmiş hizmet sayfası | Evet |
| `/hizmetler/sehirler-arasi-nakliyat.html` | Üretilmiş hizmet sayfası | Evet |
| `/hizmetler/ofis-isyeri-tasima.html` | Üretilmiş hizmet sayfası | Evet |
| `/hizmetler/asansorlu-tasima.html` | Üretilmiş hizmet sayfası | Evet |
| `/hizmetler/parca-esya-tasima.html` | Üretilmiş hizmet sayfası | Evet |
| `/bolgeler/edremit-nakliyat.html` | Hizmet bölgeleri merkezi | Evet |
| `/hakkimizda.html` | Kurumsal içerik | Evet |
| `/iletisim.html` | NAP ve çalışma saatleri | Evet |
| `/gizlilik.html` | Gizlilik bilgisi | Hayır (`noindex`) |
| `/404.html` | Özel hata belgesi | Hayır (`noindex`) |

Canonical host `https://www.canpolatnakliyat.com` değeridir. HTTP ve non-www istekleri ile doğrudan `index.php`/`index.html` URL’leri `.htaccess` üzerinden 301 ile canonical adrese gider.

## SEO içerik kaynağı

Alt sayfaların tek kaynağı `scripts/generate-seo-pages.js` dosyasıdır:

```bash
npm run pages:generate  # HTML çıktıları üretir
npm run pages:check     # Kaynak ile çıktının birebir eşleştiğini denetler
```

Doğrulanmış NAP, çalışma saatleri, hizmet listesi, ortak header/footer, sayfa metadata’sı ve bağlı JSON-LD grafiği bu dosyada merkezi olarak yönetilir. İşletme bilgisi değiştiğinde kaynak ve görünür ana sayfa birlikte güncellenmelidir; ardından üretim ve tüm testler çalıştırılmalıdır.

Güncel doğrulanmış NAP:

- Canpolat Evden Eve Nakliyat
- Camivasat Mah. Akçay Cad. No: 78 Edremit / Balıkesir
- 0535 912 06 91 — `tel:+905359120691`
- info@canpolatnakliyat.com
- Hafta içi 08:00–20:00, Cumartesi 08:00–18:00, Pazar 09:00–17:00

Akçay, Altınoluk, Havran ve İvrindi yalnız hizmet alanıdır; fiziksel şube olarak işaretlenmez. Türkiye geneli kapsam yalnız şehirler arası taşıma hizmetiyle ilişkilendirilir.

## Görseller ve performans

- Onaylı 13 katmanlı Hero R8 PNG’leri `assets/images/hero-r8/` altında değişmeden korunur.
- Aynı sahnenin lossless WebP türevleri ve hizmet görsellerinin 480/800/1200 px WebP türevleri `scripts/optimize-images.sh` ile üretilir.
- Kaynak hizmet PNG’leri `source-assets/services/` altında korunur; mevcut tam boy WebP’lerin kimlikleri testte kilitlidir.
- Ana sayfa yalnız kritik platform ve kamyon katmanlarını preload eder. Alt bölüm görselleri lazy-load edilir; tüm `<img>` öğelerinde ölçü ayrılır.
- Inter ve Manrope fontları `assets/fonts/` altında self-hosted WOFF2 olarak, `font-display: swap` ile yüklenir.

Türevleri yeniden üretmek ve görsel doğrulamayı çalıştırmak için:

```bash
npm run assets:optimize
```

Betik Hero WebP’lerinde alfa piksel eşitliğini, hizmet türevlerinde ise asgari PSNR eşiğini denetler. Orijinal PNG dosyalarını değiştirmez.

## Dönüşüm ölçümü hazırlığı

Telefon, WhatsApp ve teklif formu etkileşimlerinde `data-analytics-event` / `data-analytics-location` nitelikleri bulunur. Ana sayfa ayrıca mevcutsa `window.dataLayer` içine şu event adlarını yollar ve `canpolat:conversion` DOM event’ini yayınlar:

- `phone_click`
- `whatsapp_click`
- `quote_form_submit`

Sahte GA4 veya Tag Manager kimliği eklenmemiştir. Teklif formu doğrulama sonrasında kullanıcının bilgileriyle WhatsApp mesajı hazırlar; sunucuya veri göndermez.

## Dağıtım

`.github/workflows/deploy-ftp.yml`, yalnız `main` dalına push veya yetkili manuel çalıştırma sonrasında:

1. `npm test` çalıştırır.
2. `scripts/prepare-deploy.sh` ile geçici production paketini hazırlar.
3. FTP/FTPS ayarlarını doğrular.
4. Paketi canlı köke senkronlar.
5. Canlı canonical, NAP, Hero WebP, sürüm başlığı ve eski Hero URL durumunu doğrular.

Bu repo üzerinde yerel değişiklik yapmak canlıya dağıtım değildir. Commit, push, `main` birleştirmesi veya workflow çalıştırması ayrıca yetki gerektirir.

Gerekli GitHub yapılandırması:

| Tür | Ad | Açıklama |
| --- | --- | --- |
| Secret | `FTP_SERVER` | FTP sunucu adı |
| Secret | `FTP_USERNAME` | Siteye özel FTP kullanıcısı |
| Secret | `FTP_PASSWORD` | FTP parolası |
| Variable | `FTP_SERVER_DIR` | Siteye özel hesabın kökü için `./` |
| Variable | `FTP_PROTOCOL` | Tercihen `ftps` |
| Variable | `FTP_PORT` | Hosting tarafından verilen port, genellikle `21` |

`clean_live_root` seçeneği yalnız manuel ve bilinçli temizlik içindir. `.well-known`, `cgi-bin` ve dağıtım durum dosyası korunur; `dangerous-clean-slate` kullanılmaz.
