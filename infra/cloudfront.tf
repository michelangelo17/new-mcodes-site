# Site delivery: CloudFront (TLS + apex via R53 ALIAS) in front of the Scaleway
# bucket website endpoint. Content stays in the EU (Scaleway origin); only the
# edge is AWS. ACM + CloudFront must be in us-east-1, which the aws provider is
# pinned to.

resource "aws_acm_certificate" "site" {
  domain_name               = var.site_domain
  subject_alternative_names = ["www.${var.site_domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.site.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id         = var.route53_zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 300
  allow_overwrite = true # overwrite any stale validation records from a prior cert
}

resource "aws_acm_certificate_validation" "site" {
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  default_root_object = "index.html"
  aliases             = [var.site_domain, "www.${var.site_domain}"]
  price_class         = "PriceClass_100" # NA + EU edges

  origin {
    # Website endpoint (not the REST endpoint) so /blog/slug/ resolves to its
    # index.html. Stripped of any scheme for CloudFront's bare-host requirement.
    domain_name = replace(replace(scaleway_object_bucket_website_configuration.site.website_endpoint, "https://", ""), "http://", "")
    origin_id   = "scaleway-site"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # Scaleway website endpoint is HTTP
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "scaleway-site"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
