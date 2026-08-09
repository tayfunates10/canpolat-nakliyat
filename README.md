# Canpolat Nakliyat — Kurumsal Web Sitesi

Canpolat Nakliyat'ın production web sitesi; PHP ile sunulan ana sayfa şablonu, statik iç sayfalar, Vanilla JavaScript, ortak responsive CSS ve FTP tabanlı otomatik dağıtım kullanır. Framework veya build zorunluluğu yoktur.

## Yerel çalıştırma

PHP yüklü bir ortamda depo kökünde:

```bash
npm run serve
```

Ardından `http://127.0.0.1:8099` adresini açın.

Production kalite kontrolleri:

```bash
npm test
```

PHP bulunmayan bir inceleme ortamında yalnız statik denetimler `npm run test:static` komutuyla çalıştırılabilir; production kapısı her zaman tam `npm test` paketini kullanır.

Test paketi; HTML bağlantılarını, Hero R8 katmanlarını ve görsel kimliklerini, responsive kuralları, form/backend bütünlüğünü, SEO ve güvenlik ayarlarını ve FTP temizleme davranışını denetler.

## Production mimarisi

Ana sayfa doğrudan statik `index.html` değildir:

1. Apache `.htaccess`, kök isteğini dahili olarak `index.php` dosyasına yönlendirir.
2. `index.php`, özel şablon olan `index-template.html` dosyasını okur.
3. `index.php` şablonu metin dönüşümü yapmadan doğrudan sunar; production içeriği kaynakta açık ve test edilebilir durumdadır.
4. `index-template.html` dışarıdan doğrudan erişime kapalıdır.
5. Eski `index.html`, yalnız eski ortamlardaki güvenli yönlendirme stub'ı olarak tutulur; normal production isteğinde servis edilmez.

### Ana dosyalar

| Yol | Görev |
| --- | --- |
| `index.php` | Production ana sayfa renderer'ı |
| `index-template.html` | Ana sayfanın özel HTML şablonu |
| `index.html` | Eski uyumluluk/yönlendirme stub'ı |
| `css/style.css` | Ana sayfa ve tüm iç sayfaların ortak responsive tasarımı |
| `css/services-tune.css` | Eski sürümle uyumluluk için korunan hizmet stili |
| `css/hero-animated.css` | Onaylı Hero R8 katman düzeni ve animasyonları |
| `js/script.js` | Menü, SSS, yumuşak kaydırma ve genel etkileşimler |
| `js/quote-form.js` | Gerçek fiyat teklifi gönderimini `/api/teklif.php` endpoint'ine bağlar |
| `js/hero-animated.js` | Hero R8 katmanlarının yükleme/animasyon yönetimi |
| `api/teklif.php` | Sunucu tarafı teklif doğrulama, spam sınırı ve e-posta teslimi |
| `.htaccess` | HTTPS/www canonical, güvenlik başlıkları ve yönlendirmeler |
| `scripts/prepare-deploy.sh` | Production FTP paketini oluşturur ve zorunlu dosyaları doğrular |
| `tests/site-audit.js` | Görsel/HTML/Hero regresyon denetimi |
| `tests/completion-audit.js` | Form, SEO, güvenlik ve production tamamlama denetimi |

## Fiyat teklif formu

Ana sayfadaki fiyat teklif formu artık demo değildir.

- Endpoint: `/api/teklif.php`
- Yöntem: `POST`
- JavaScript açıkken JSON/fetch kullanılır.
- JavaScript kapalıysa standart form POST'u ve 303 yönlendirmesiyle progressive enhancement çalışır.
- Zorunlu alanlar: Ad Soyad, Telefon, Nereden, Nereye, Taşınma Tarihi.
- E-posta isteğe bağlıdır ve doldurulursa sunucu tarafında doğrulanır.
- Basit honeypot ve kısa süreli tekrar gönderim sınırı uygulanır.
- Başarılı talep varsayılan olarak `info@canpolatnakliyat.com` adresine e-posta ile teslim edilir.
- Hosting ortamında farklı alıcı gerekiyorsa `CANPOLAT_QUOTE_EMAIL` ortam değişkeni kullanılabilir.
- Hosting üzerinde PHP `mail()` devre dışıysa endpoint başarısızlığı kullanıcıya açıkça bildirir ve telefon/WhatsApp alternatifi gösterilir.

> Production sonrası gerçek bir test talebi göndererek hostingin e-posta teslim yeteneği ayrıca doğrulanmalıdır. CI, güvenlik nedeniyle gerçek müşteri talebi/e-posta göndermez.

## Hizmet sayfaları

Ana sayfadaki beş “Detaylı Bilgi” kartı aşağıdaki gerçek sayfalara bağlanır:

- `hizmetler/evden-eve-nakliyat.html`
- `hizmetler/sehirler-arasi-nakliyat.html`
- `hizmetler/ofis-isyeri-tasima.html`
- `hizmetler/asansorlu-tasima.html`
- `hizmetler/paketleme-montaj.html`

Ek SEO sayfaları arasında `hakkimizda.html`, `bolgeler/edremit-nakliyat.html` ve `gizlilik.html` bulunur.

## Görsel politikası

Mevcut Hero R8 ve hizmet görselleri testlerde hash/ölçü ile kilitlidir. Görsel kararlar koddan bağımsız ele alınmalıdır.

- Yeni görsel üretilecekse önce görsel hazırlanır ve onaylanır.
- Onay olmadan mevcut Hero katmanları, hizmet görselleri veya görsel kompozisyon değiştirilmez.
- Hero R8 production'da 13 katmandan oluşur ve `tests/site-audit.js` bu bütünlüğü zorunlu tutar.

## SEO ve canonical

Production için tek tercih edilen origin:

```text
https://www.canpolatnakliyat.com
```

`.htaccess` HTTP isteklerini HTTPS'e ve non-www hostunu `www` hostuna 301 yönlendirir. Sitemap ve robots dosyaları da aynı origin'i kullanır. `404.html` indekslemeye kapalıdır; API ve özel template robots taramasından hariç tutulur.

## Güvenlik

`.htaccess` aşağıdaki temel başlıkları uygular:

- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security`
- `Content-Security-Policy`

Form endpoint'i ayrıca POST zorlaması, sunucu tarafı doğrulama, honeypot, giriş uzunluk sınırları ve kısa süreli hız sınırlaması uygular.

## Gizlilik

`gizlilik.html`, web formunda toplanabilecek alanları, işleme amaçlarını, aktarım kapsamını, saklama yaklaşımını, standart sunucu/güvenlik kayıtlarını ve KVKK kapsamındaki ilgili kişi haklarını açıklar.

Form verileri reklam hedefleme amacıyla kullanılmaz. Site, üçüncü taraf reklam veya analiz çerezi kullanmaz.

## Otomatik FTP dağıtımı

`.github/workflows/deploy-ftp.yml`, `main` dalına push sonrasında:

1. `npm test` çalıştırır.
2. Shell/Node deploy betiklerini syntax seviyesinde doğrular.
3. `scripts/prepare-deploy.sh` ile yalnız gerekli production dosyalarını paketler.
4. FTP/FTPS ayarlarını doğrular.
5. Paketi hosting köküne senkronlar.
6. Canlı Hero R8 sürümünü, katman sayısını ve eski Hero dosyalarının servis edilmediğini doğrular.

Gerekli GitHub Secrets:

- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`

Gerekli/önerilen repository variables:

- `FTP_SERVER_DIR=./`
- `FTP_PROTOCOL=ftps`
- `FTP_PORT=21`

FTP hesabı doğrudan Canpolat sitesi production köküne sınırlandırılmalıdır.

## İletişim verilerini güncelleme

Telefon, WhatsApp, e-posta, adres ve çalışma saatleri birden fazla sayfada ve JSON-LD içinde bulunabilir. Değişiklik yaparken `npm test` çalıştırın ve sitemap/canonical/structured-data tutarlılığını koruyun.

Mevcut ana iletişim değerleri:

- Telefon: `0 535 912 06 91`
- Telefon URI: `tel:+905359120691`
- WhatsApp: `https://wa.me/905359120691`
- E-posta: `info@canpolatnakliyat.com`
- Adres: `Camivasat Mah. Akçay Cad. No: 78, Edremit / Balıkesir`
- Alan adı: `https://www.canpolatnakliyat.com`
- Hafta içi: `08:00–20:00`
- Cumartesi: `08:00–18:00`
- Pazar: `09:00–17:00`

## Production kontrol listesi

Her değişiklikte:

```bash
npm test
```

Ardından `main` dağıtım workflow'unun test, paket, FTP ve canlı doğrulama adımlarının başarılı olduğu kontrol edilmelidir. Form/backend değişikliklerinde ayrıca canlı ortamda kontrollü bir teklif gönderimiyle e-posta tesliminin hosting seviyesinde çalıştığı doğrulanmalıdır.
