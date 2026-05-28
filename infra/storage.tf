# Site bucket + website hosting + public read. Built files are synced in by CI
# (scripts/deploy-site.sh), not managed as TF objects.

resource "scaleway_object_bucket" "site" {
  name   = var.site_bucket_name
  region = var.region
}

resource "scaleway_object_bucket_website_configuration" "site" {
  bucket = scaleway_object_bucket.site.name

  index_document {
    suffix = "index.html"
  }

  # Point at a real 404.html once the site has one.
  error_document {
    key = "index.html"
  }
}

resource "scaleway_object_bucket_policy" "site" {
  bucket = scaleway_object_bucket.site.name
  policy = jsonencode({
    Version = "2023-04-17"
    Id      = "site-public-read"
    Statement = [{
      Sid       = "AllowPublicRead"
      Effect    = "Allow"
      Principal = "*"
      Action    = ["s3:GetObject"]
      Resource  = ["${var.site_bucket_name}/*"]
    }]
  })
}
