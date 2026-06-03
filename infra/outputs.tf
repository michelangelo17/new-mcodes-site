output "site_bucket" {
  value       = scaleway_object_bucket.site.name
  description = "Object Storage bucket for the static site (sync target)."
}

output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.site.domain_name
  description = "CloudFront domain the R53 aliases point at."
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.site.id
  description = "Used to invalidate the cache after a site deploy."
}

output "mcp_container_endpoint" {
  value       = scaleway_container.mcp.public_endpoint
  description = "Container endpoint (CNAME target for the mcp subdomain)."
}

output "registry_endpoint" {
  value       = scaleway_registry_namespace.mcp.endpoint
  description = "Registry endpoint to push the MCP image to."
}

output "github_deploy_role_arn" {
  value       = aws_iam_role.github_deploy.arn
  description = "Set this as GitHub repo secret AWS_ROLE_ARN after the first local apply."
}
