# CANPOLAT-PLATFORM-01-R8 — Hero Asset Manifest

Tuval: `1536 × 1024` — `3:2` — sRGB — PNG RGBA — gerçek alfa.

Bu klasördeki görseller yeniden çizilemez, kırpılamaz, döndürülemez veya obje bazında responsive yeniden konumlandırılamaz. Her katman tam `1536 × 1024` tuval olarak X:0/Y:0 üst üste bindirilir ve yalnızca bütün sahne responsive olarak ölçeklenir.

## Kesin Z sırası

`P00 → L09 → T00 → L01 → L02 → L04 → L03 → L05 → L06 → L10 → L11 → L07 → L08`

## Beklenen dosyalar ve SHA-256

| Kod | Dosya | SHA-256 |
|---|---|---|
| P00 | `platform-p00-r8-reference-exact.png` | `6a2218996325d954fd17e938d5f105929489952f57753967dd98f04fabdec47b` |
| L09 | `layer-l09-r6.png` | `7c087183945ba233220473ad349b79061ce50b6efb4b46f42e01f1ec7ef82111` |
| T00 | `truck-t00-r6.png` | `2efda3aba4ddb2b07788612c3a4e2a94bdb9b9ce92e69bbd995f19844b38aef0` |
| L01 | `layer-l01-r6.png` | `e5e5885eae573f43f2b83360c2709e649b384442bb2c5b2533caa6e530cbd95e` |
| L02 | `layer-l02-r6.png` | `3c57c46a32d842ecc7db07aa42ccb596b68b31b96febf3eb6f6d59061aa4fbca` |
| L04 | `layer-l04-r6.png` | `a1e0fb5922a77a46c6ca31eeff9389f8d14f4795ff3845979cbbfbfda409379c` |
| L03 | `layer-l03-r6.png` | `4655bcaa7db698f6fb24f077158d3dedc17a5bb85979e53628f1e94c5da345d8` |
| L05 | `layer-l05-r6.png` | `a5b7f5fa0dfcd5496eee26bf92a3d9564f6396767a2b388634eb8a54de3b4ff0` |
| L06 | `layer-l06-r6.png` | `70688757b277b63a008ce09a924c1808a38e6adc7859f8558e0f6700ee311875` |
| L10 | `layer-l10-r6.png` | `a94a419d89f1fb69eda499d59fa71e73416ffc922f513d0d03f6d530adf87541` |
| L11 | `layer-l11-r6.png` | `fba52d10cde807a49856c6e1b9e7f3489bd26f12d79c3b28b82c75e6a3a7db30` |
| L07 | `layer-l07-r6.png` | `b8a08d6dd1e033c381580865d388fdeffce7b91c1100ca7527c1d89aa89fd77c` |
| L08 | `layer-l08-r6.png` | `d5d6c239a42eb13c06f306e7ca5b3c47c32707de26e4c9a031d3c03eaa47d5fc` |

Final R8 kompozit doğrulama SHA-256: `6081e718cd395826e52a7cf160ccbfea22140aa07165cf0fc3a03059601d4978`.

## Animasyon sırası

| Sıra | Kod | Başlangıç X/Y | Ölçek | Gecikme | Süre |
|---:|---|---:|---:|---:|---:|
| 1 | P00 | `0% / 0%` | `.98` | `0ms` | `500ms` |
| 2 | T00 | `5% / 0%` | `.98` | `150ms` | `750ms` |
| 3 | L09 | `3% / 3%` | `.98` | `400ms` | `650ms` |
| 4 | L03 | `0% / 4%` | `.98` | `520ms` | `600ms` |
| 5 | L02 | `-3% / 1%` | `.98` | `660ms` | `650ms` |
| 6 | L01 | `-3% / 1%` | `.98` | `800ms` | `700ms` |
| 7 | L04 | `0% / 4%` | `.98` | `940ms` | `600ms` |
| 8 | L05 | `0% / 3%` | `.98` | `1080ms` | `500ms` |
| 9 | L06 | `0% / 3%` | `.97` | `1200ms` | `500ms` |
| 10 | L10 | `0% / 3%` | `.98` | `1300ms` | `500ms` |
| 11 | L11 | `0% / 3%` | `.98` | `1400ms` | `500ms` |
| 12 | L07 | `0% / 3%` | `.98` | `1500ms` | `500ms` |
| 13 | L08 | `0% / 1%` | `.99` | `1600ms` | `450ms` |

L08 easing: `ease-out`; diğer katmanlar: `cubic-bezier(.22,1,.36,1)`.

## Fallback davranışı

Tüm 13 R8 katmanı başarıyla yüklenene kadar mevcut `hero-canpolat.webp / hero-canpolat-mobil.webp` görseli gösterilir. Tek bir katman dahi yüklenmezse R8 animasyonu başlatılmaz ve mevcut hero fallback olarak kalır. Bu sayede eksik binary asset ile kırık canlı hero oluşmaz.
