#!/usr/bin/env bash
set -Eeuo pipefail

required_names=(
  "FTP_SERVER"
  "FTP_USERNAME"
  "FTP_PASSWORD"
  "FTP_SERVER_DIR"
)

for name in "${required_names[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "HATA: Eksik GitHub Actions ayarı: ${name}" >&2
    exit 1
  fi
done

if [[ "${FTP_SERVER}" == *"://"* || "${FTP_SERVER}" == */* ]]; then
  echo "HATA: FTP_SERVER yalnızca sunucu adı olmalıdır; protokol veya klasör içermemelidir." >&2
  exit 1
fi

case "${FTP_SERVER_DIR}" in
  public_html/canpolatnakliyat.com/|/public_html/canpolatnakliyat.com/)
    ;;
  *)
    echo "HATA: FTP_SERVER_DIR yalnızca public_html/canpolatnakliyat.com/ olmalıdır." >&2
    exit 1
    ;;
esac

case "${FTP_PROTOCOL:-ftps}" in
  ftp|ftps|ftps-legacy)
    ;;
  *)
    echo "HATA: FTP_PROTOCOL ftp, ftps veya ftps-legacy olmalıdır." >&2
    exit 1
    ;;
esac

FTP_PORT="${FTP_PORT:-21}"
if [[ ! "${FTP_PORT}" =~ ^[0-9]+$ ]] || (( FTP_PORT < 1 || FTP_PORT > 65535 )); then
  echo "HATA: FTP_PORT 1-65535 arasında bir sayı olmalıdır." >&2
  exit 1
fi

echo "FTP ayarları doğrulandı."
