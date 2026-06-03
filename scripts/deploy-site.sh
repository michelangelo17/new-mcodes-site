#!/usr/bin/env bash
# Build the site and sync it to Scaleway Object Storage. Needs aws CLI with
# Scaleway creds and SCW_BUCKET + SCW_S3_ENDPOINT set (see SETUP.md).
set -euo pipefail

# Auto-load root .env if present so locally you don't need to export anything.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$ROOT/.env" ]; then
  set -a; . "$ROOT/.env"; set +a
fi

: "${SCW_ACCESS_KEY:?set SCW_ACCESS_KEY}"
: "${SCW_SECRET_KEY:?set SCW_SECRET_KEY}"
: "${SCW_BUCKET:?set SCW_BUCKET}"
: "${SCW_S3_ENDPOINT:?set SCW_S3_ENDPOINT}"
SCW_REGION="${SCW_REGION:-fr-par}"

# aws CLI talks to Scaleway via --endpoint-url, using the Scaleway keys under
# the AWS_* names. Drop any real-AWS session token from the surrounding env.
export AWS_ACCESS_KEY_ID="$SCW_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$SCW_SECRET_KEY"
unset AWS_SESSION_TOKEN

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
