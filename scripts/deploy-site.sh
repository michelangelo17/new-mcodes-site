#!/usr/bin/env bash
# Build the site and sync it to Scaleway Object Storage. Needs aws CLI with
# Scaleway creds and SCW_BUCKET + SCW_S3_ENDPOINT set (see SETUP.md).
set -euo pipefail

: "${SCW_BUCKET:?set SCW_BUCKET}"
: "${SCW_S3_ENDPOINT:?set SCW_S3_ENDPOINT}"
SCW_REGION="${SCW_REGION:-fr-par}"

cd "$(dirname "$0")/../site"
npm ci
npm run build

s3=(aws s3 --endpoint-url "$SCW_S3_ENDPOINT" --region "$SCW_REGION")

# Hashed assets: cache forever. (--delete prunes stale; HTML excluded here.)
"${s3[@]}" sync dist/ "s3://${SCW_BUCKET}/" \
  --delete \
  --exclude "*.html" \
  --cache-control "public, max-age=31536000, immutable"

# HTML: always revalidate.
"${s3[@]}" sync dist/ "s3://${SCW_BUCKET}/" \
  --exclude "*" --include "*.html" \
  --cache-control "public, max-age=0, must-revalidate" \
  --content-type "text/html; charset=utf-8"
