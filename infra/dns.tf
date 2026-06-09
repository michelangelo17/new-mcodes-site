# Route 53 records. Apex + www ALIAS to CloudFront (R53 allows ALIAS to a
# CloudFront target, which is what makes the bare apex work). MCP subdomain
# CNAMEs to the Scaleway container.

resource "aws_route53_record" "apex" {
  zone_id = var.route53_zone_id
  name    = var.site_domain
  type    = "A"
  # Overwrite any record the old site left on these names — they should point
  # at this distribution now.
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id         = var.route53_zone_id
  name            = "www.${var.site_domain}"
  type            = "A"
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "mcp" {
  zone_id = var.route53_zone_id
  name    = var.mcp_domain
  type    = "CNAME"
  ttl     = 300
  records = [replace(scaleway_container.mcp.public_endpoint, "https://", "")]
}
