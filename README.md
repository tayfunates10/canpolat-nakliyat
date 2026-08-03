# Canpolat Nakliyat Web Sitesi

Bu depo, `okur-nakliyat` projesindeki statik mimari yaklaşım referans alınarak **Canpolat Nakliyat için sıfırdan yeniden tasarlanmıştır**. Kaynak repoda değişiklik yapılmamıştır.

## Tasarım sistemi

- Marka paleti: turuncu `#F28C18`, lacivert `#14283B`, beyaz ve açık gri
- Fotoğraf yerine özgün SVG/CSS illüstrasyonlar
- Mobil öncelikli responsive yapı
- `prefers-reduced-motion` desteği
- Klavye odağı, atlama bağlantısı ve semantik HTML
- Edremit odaklı yerel SEO ve Türkiye geneli şehirler arası hizmet sayfaları
- Yapısal veri, sitemap, robots, güvenlik başlıkları ve 404 sayfası

## Çalıştırma

```bash
npm run serve
```

Site `http://localhost:8099` adresinde açılır.

## Test

```bash
npm test
```

Test; HTML zorunlu etiketlerini, yerel bağlantıları ve eski Okur Nakliyat marka kalıntılarını kontrol eder.

## Yayına almadan önce

- Onaylı nihai logo ile `assets/images/canpolat-logo.svg` dosyasını değiştirin.
- Kesin işletme adresi varsa şema ve footer alanına ekleyin.
- Open Graph için 1200×630 sosyal paylaşım görseli ekleyin.
- Alan adında SSL etkinleşmeden `.htaccess` HTTPS yönlendirmesini açmayın.
