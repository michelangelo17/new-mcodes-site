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

  # Apply after the website config so the two bucket-level writes don't race.
  depends_on = [scaleway_object_bucket_website_configuration.site]

  # A bucket policy is deny-by-default: any principal/action not explicitly
  # allowed is denied, including the org owner. The first statement keeps the
  # deploy application's full access so applying this policy can't lock the
  # pipeline (or you) out of the bucket; the second is the public read the
  # website endpoint needs.
  policy = jsonencode({
    Version = "2023-04-17"
    Id      = "site-policy"
    Statement = [
      {
        Sid       = "DeployFullAccess"
        Effect    = "Allow"
        Principal = { SCW = "application_id:${var.deploy_application_id}" }
        Action    = ["s3:*"]
        Resource = [
          var.site_bucket_name,
          "${var.site_bucket_name}/*",
        ]
      },
      {
        Sid       = "PublicRead"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject"]
        Resource  = ["${var.site_bucket_name}/*"]
      },
    ]
  })
}
