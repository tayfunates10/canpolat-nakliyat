#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_PATH="$(mktemp -d /tmp/canpolat-build.XXXXXX)"

cleanup() {
  rm -rf "${BUILD_PATH}"
}
trap cleanup EXIT

cd "${REPO_ROOT}"
npm test
scripts/prepare-deploy.sh "${BUILD_PATH}"

file_count="$(find "${BUILD_PATH}" -type f | wc -l | tr -d ' ')"
printf 'Production build doğrulandı: %s dosya\n' "${file_count}"
