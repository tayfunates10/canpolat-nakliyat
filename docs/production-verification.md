# Production Verification

Bu dosya Canpolat Nakliyat production yayın kapısının amaçlarını belgeler ve yalnızca depo içi operasyon dokümantasyonudur; `scripts/prepare-deploy.sh` tarafından canlı site paketine dahil edilmez.

Production dağıtımının başarılı sayılması için GitHub Actions akışı aşağıdaki kapıların tamamını doğrular:

- tam `npm test` paketi (PHP lint + site/completion/FTP-cleanup audit),
- deploy betiklerinin syntax kontrolü,
- production paketinin eksiksiz hazırlanması,
- FTP/FTPS yapılandırmasının doğrulanması,
- production köküne FTP dağıtımı,
- Hero R8-11 sürüm başlığı, P00/T00 ve 13 katman bütünlüğü,
- eski Hero URL'lerinin servis edilmemesi,
- ana sayfa canonical/form/hizmet bağlantıları,
- Paketleme ve Montaj hizmet sayfası,
- gizlilik/NAP ve robots kuralları,
- teklif API GET/POST sağlık kontrolü,
- bilinmeyen URL için gerçek HTTP 404, markalı 404 gövdesi ve `X-Robots-Tag: noindex, follow`.

Bu kontrol dosyasındaki değişiklik production dosyalarını değiştirmez; `main` push akışını yeniden çalıştırarak mevcut canlı sürümün tüm kapılardan tekrar doğrulanmasını sağlar.
